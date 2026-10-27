import 'dotenv/config';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Task from '@/models/Task';
import Note from '@/models/Note';
import NoteGroup from '@/models/NoteGroup';
import Routine from '@/models/Routine';
import Idea from '@/models/Idea';
import CustomSection from '@/models/custom/CustomSection';
import CustomRecord from '@/models/custom/CustomRecord';
import Transaction from '@/models/Transaction';
import Account from '@/models/Account';
import TrashItem from '@/models/TrashItem';
import {
  moveToTrash,
  getTrashItems,
  restoreFromTrash,
  permanentlyDeleteTrashItem,
  purgeExpiredTrash,
} from '@/actions/trash.actions';
import { createTask } from '@/actions/task.actions';
import { createTransaction } from '@/actions/transaction.actions';

// Mock next-auth
const mockGetServerSession = jest.fn();
jest.mock('next-auth', () => ({
  getServerSession: () => mockGetServerSession(),
}));

// Mock next/cache
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// Mock workspace info
const mockWorkspaceId = new mongoose.Types.ObjectId();
jest.mock('@/actions/workspace.actions', () => ({
  getActiveWorkspaceInfo: jest.fn().mockImplementation(async () => ({
    activeWorkspace: {
      _id: mockWorkspaceId.toString(),
      type: 'personal',
      name: 'Personal Workspace',
    },
  })),
}));

// Mock cloudinary delete
const mockDeleteAttachments = jest.fn().mockResolvedValue(true);
jest.mock('@/actions/cloudinary.actions', () => ({
  deleteAttachments: (...args: any[]) => mockDeleteAttachments(...args),
  deleteImage: jest.fn().mockResolvedValue(true),
}));
jest.mock('@/lib/cloudinary-internal', () => ({
  systemDeleteAttachments: (...args: any[]) => {
    const [attachments, token] = args;
    const cronSecret = process.env.CRON_SECRET || 'test-cron-secret-2026';
    if (!token || token !== cronSecret) {
      return Promise.reject(new Error("Unauthorized system operation: invalid or missing system authorization token"));
    }
    return mockDeleteAttachments(...args);
  },
  systemDeleteImage: (...args: any[]) => {
    const [publicId, token] = args;
    const cronSecret = process.env.CRON_SECRET || 'test-cron-secret-2026';
    if (!token || token !== cronSecret) {
      return Promise.reject(new Error("Unauthorized system operation: invalid or missing system authorization token"));
    }
    return Promise.resolve({ success: true });
  },
}));

describe('7-Day Recovery Trash Lifecycle & Accounting Tests', () => {
  const userAId = new mongoose.Types.ObjectId();
  const userBId = new mongoose.Types.ObjectId();

  beforeAll(async () => {
    await dbConnect();
    await User.deleteMany({ email: { $in: ['trash-user-a@manageo.app', 'trash-user-b@manageo.app'] } });
    await TrashItem.deleteMany({});
    await Task.deleteMany({});
    await Transaction.deleteMany({});
    await Account.deleteMany({});

    await User.create([
      {
        _id: userAId,
        name: 'User A',
        email: 'trash-user-a@manageo.app',
        passwordHash: 'dummy-hash',
      },
      {
        _id: userBId,
        name: 'User B',
        email: 'trash-user-b@manageo.app',
        passwordHash: 'dummy-hash',
      },
    ]);

    // Set active session to User A by default
    mockGetServerSession.mockResolvedValue({
      user: { id: userAId.toString(), email: 'trash-user-a@manageo.app' },
    });
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $in: ['trash-user-a@manageo.app', 'trash-user-b@manageo.app'] } });
    await TrashItem.deleteMany({});
    await Task.deleteMany({});
    await Transaction.deleteMany({});
    await Account.deleteMany({});
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  describe('1. Soft Deletion & Query Exclusion', () => {
    let createdTaskId: string;

    it('soft deletes a task and creates a corresponding TrashItem record', async () => {
      const taskRes = await createTask({ title: 'Important Task to Recover', status: 'Inbox' });
      expect(taskRes.success).toBe(true);
      createdTaskId = taskRes.task._id.toString();

      const trashRes = await moveToTrash('Task', createdTaskId);
      expect(trashRes.success).toBe(true);

      // Verify normal query excludes soft-deleted record
      const queried = await Task.findById(createdTaskId);
      expect(queried).toBeNull();

      // Verify querying with explicit condition finds the record marked as deleted
      const rawDoc = await Task.collection.findOne({ _id: new mongoose.Types.ObjectId(createdTaskId) });
      expect(rawDoc).not.toBeNull();
      expect(rawDoc?.isDeleted).toBe(true);
      expect(rawDoc?.deletedAt).toBeInstanceOf(Date);
      expect(rawDoc?.purgeAt).toBeInstanceOf(Date);

      // Verify TrashItem exists
      const trashDoc = await TrashItem.findOne({ entityId: createdTaskId, entityType: 'Task' });
      expect(trashDoc).not.toBeNull();
      expect(trashDoc?.title).toBe('Important Task to Recover');
      expect(trashDoc?.status).toBe('active');
    });

    it('restores the soft-deleted task before 7 days', async () => {
      const trashDoc = await TrashItem.findOne({ entityId: createdTaskId, entityType: 'Task' });
      expect(trashDoc).not.toBeNull();

      const restoreRes = await restoreFromTrash(trashDoc!._id.toString());
      expect(restoreRes.success).toBe(true);

      // Verify task is now visible again in standard queries
      const restored = await Task.findById(createdTaskId);
      expect(restored).not.toBeNull();
      expect(restored?.isDeleted).toBe(false);

      // Verify TrashItem is removed or marked restored
      const trashAfter = await TrashItem.findById(trashDoc!._id);
      expect(trashAfter).toBeNull();
    });
  });

  describe('2. Financial Ledger Consistency during Soft-Delete & Restore', () => {
    let testAccount: any;
    let testTransaction: any;

    beforeAll(async () => {
      testAccount = await Account.create({
        userId: userAId,
        name: 'Checking Account',
        type: 'checking',
        balance: 1000,
        currency: 'USD',
      });
    });

    it('reverses transaction impact on soft-delete and re-applies on restore', async () => {
      // Create income transaction of +500
      const tx = await Transaction.create({
        userId: userAId,
        accountId: testAccount._id,
        amount: 500,
        type: 'income',
        category: 'Salary',
        date: new Date(),
        description: 'Test Income',
      });
      testTransaction = tx;

      // Update account balance to reflect +500 => 1500
      await Account.findByIdAndUpdate(testAccount._id, { balance: 1500 });
      let account = await Account.findById(testAccount._id);
      expect(Number(account?.balance)).toBe(1500);

      // Soft delete transaction
      const trashRes = await moveToTrash('Transaction', tx._id.toString());
      expect(trashRes.success).toBe(true);

      // Balance must be reversed back to 1000
      account = await Account.findById(testAccount._id);
      expect(Number(account?.balance)).toBe(1000);

      // Restore transaction
      const trashDoc = await TrashItem.findOne({ entityId: tx._id.toString(), entityType: 'Transaction' });
      expect(trashDoc).not.toBeNull();

      const restoreRes = await restoreFromTrash(trashDoc!._id.toString());
      expect(restoreRes.success).toBe(true);

      // Balance must be re-applied back to 1500
      account = await Account.findById(testAccount._id);
      expect(Number(account?.balance)).toBe(1500);
    });
  });

  describe('3. Cascading Soft-Delete & Restoration for Collections', () => {
    let sectionId: string;
    let record1Id: string;
    let record2Id: string;

    it('cascades soft-deletion from CustomSection to its CustomRecords with batch tracking', async () => {
      const section = await CustomSection.create({
        userId: userAId,
        workspaceId: mockWorkspaceId,
        name: 'Client Projects',
        slug: 'client-projects',
        fields: [],
      });
      sectionId = section._id.toString();

      const r1 = await CustomRecord.create({
        userId: userAId,
        workspaceId: mockWorkspaceId,
        sectionId: section._id,
        data: new Map([['title', 'Project Alpha']]),
      });
      const r2 = await CustomRecord.create({
        userId: userAId,
        workspaceId: mockWorkspaceId,
        sectionId: section._id,
        data: new Map([['title', 'Project Beta']]),
      });
      record1Id = r1._id.toString();
      record2Id = r2._id.toString();

      // Soft delete section
      const trashRes = await moveToTrash('CustomSection', sectionId);
      expect(trashRes.success).toBe(true);

      // Both section and records must be excluded from standard queries
      expect(await CustomSection.findById(sectionId)).toBeNull();
      expect(await CustomRecord.findById(record1Id)).toBeNull();
      expect(await CustomRecord.findById(record2Id)).toBeNull();

      // Verify records are tagged with batchId
      const rawRecord = await CustomRecord.collection.findOne({ _id: new mongoose.Types.ObjectId(record1Id) });
      expect(rawRecord?.isDeleted).toBe(true);
      expect(rawRecord?.deletionBatchId).toBeDefined();

      // Restore section
      const trashItem = await TrashItem.findOne({ entityId: sectionId, entityType: 'CustomSection' });
      expect(trashItem).not.toBeNull();

      const restoreRes = await restoreFromTrash(trashItem!._id.toString());
      expect(restoreRes.success).toBe(true);

      // Section and all records must now be restored
      expect(await CustomSection.findById(sectionId)).not.toBeNull();
      expect(await CustomRecord.findById(record1Id)).not.toBeNull();
      expect(await CustomRecord.findById(record2Id)).not.toBeNull();
    });
  });

  describe('4. Cloudinary Asset Retention & Permanent Deletion', () => {
    it('preserves attachments during soft-delete and only destroys them on permanent delete', async () => {
      mockDeleteAttachments.mockClear();

      const note = await Note.create({
        userId: userAId,
        workspaceId: mockWorkspaceId,
        groupId: new mongoose.Types.ObjectId(),
        slug: 'note-with-attachment-' + Date.now(),
        title: 'Note with attachment',
        body: 'Important text',
        attachments: [
          {
            url: 'https://cloudinary.com/test-doc.pdf',
            publicId: 'manageo/user-a/test-doc-123',
            resourceType: 'raw',
            originalFilename: 'test-doc.pdf',
          },
        ],
      });

      // Soft delete note
      await moveToTrash('Note', note._id.toString());

      // Cloudinary delete must NOT have been called yet
      expect(mockDeleteAttachments).not.toHaveBeenCalled();

      // Permanent delete
      const trashDoc = await TrashItem.findOne({ entityId: note._id.toString(), entityType: 'Note' });
      expect(trashDoc).not.toBeNull();

      const permRes = await permanentlyDeleteTrashItem(trashDoc!._id.toString());
      expect(permRes.success).toBe(true);

      // Cloudinary delete MUST now have been called
      expect(mockDeleteAttachments).toHaveBeenCalledTimes(1);
      expect(mockDeleteAttachments).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ publicId: 'manageo/user-a/test-doc-123' }),
        ])
      );

      // Entity is completely wiped from collection
      const rawNote = await Note.collection.findOne({ _id: note._id });
      expect(rawNote).toBeNull();
    });
  });

  describe('5. Background Purge of Expired Trash (purgeExpiredTrash)', () => {
    it('purges items past their 7-day expiration while leaving non-expired items intact', async () => {
      // Create one item expired yesterday
      const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const taskRes = await createTask({ title: 'Old Expired Task', status: 'Inbox' });
      const expiredTask = taskRes.task;
      await Task.collection.updateOne(
        { _id: expiredTask._id },
        { $set: { isDeleted: true, deletedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), purgeAt: expiredDate } }
      );
      await TrashItem.create({
        userId: userAId,
        deletedBy: userAId,
        module: 'tasks',
        entityType: 'Task',
        entityId: expiredTask._id.toString(),
        title: 'Old Expired Task',
        status: 'active',
        deletedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        purgeAt: expiredDate,
      });

      // Create one fresh item expiring in 6 days
      const freshRes = await createTask({ title: 'Fresh Trashed Task', status: 'Inbox' });
      const freshTask = freshRes.task;
      await moveToTrash('Task', freshTask._id.toString());

      // Run background purge
      const purgeResult = await purgeExpiredTrash(100);
      expect(purgeResult.success).toBe(true);
      expect(purgeResult.purgedCount).toBeGreaterThanOrEqual(1);

      // Expired task is permanently gone
      const expiredInDb = await Task.collection.findOne({ _id: expiredTask._id });
      expect(expiredInDb).toBeNull();

      // Fresh task remains in Trash
      const freshInTrash = await TrashItem.findOne({ entityId: freshTask._id.toString() });
      expect(freshInTrash).not.toBeNull();
    });
  });

  describe('6. Multi-Tenant & Multi-User Isolation in Trash', () => {
    it('prevents User B from accessing, restoring, or permanently deleting User A trash items', async () => {
      // Create item as User A
      const taskRes = await createTask({ title: 'Private User A Task', status: 'Inbox' });
      const task = taskRes.task;
      await moveToTrash('Task', task._id.toString());
      const trashDoc = await TrashItem.findOne({ entityId: task._id.toString() });
      expect(trashDoc).not.toBeNull();

      // Switch session to User B
      mockGetServerSession.mockResolvedValueOnce({
        user: { id: userBId.toString(), email: 'trash-user-b@manageo.app' },
      });

      // User B attempts to restore User A's item
      const restoreAttempt = await restoreFromTrash(trashDoc!._id.toString());
      expect(restoreAttempt.success).toBe(false);
      expect(restoreAttempt.error).toBeDefined();

      // User B attempts to permanently delete User A's item
      mockGetServerSession.mockResolvedValueOnce({
        user: { id: userBId.toString(), email: 'trash-user-b@manageo.app' },
      });
      const deleteAttempt = await permanentlyDeleteTrashItem(trashDoc!._id.toString());
      expect(deleteAttempt.success).toBe(false);
      expect(deleteAttempt.error).toBeDefined();
    });
  });

  describe('7. Query Mechanisms & Aggregation Coverage', () => {
    let activeTaskId: string;
    let deletedTaskId: string;

    beforeAll(async () => {
      const activeRes = await createTask({ title: 'Active Task for Query Test', status: 'Inbox' });
      activeTaskId = activeRes.task._id.toString();

      const deletedRes = await createTask({ title: 'Deleted Task for Query Test', status: 'Done' });
      deletedTaskId = deletedRes.task._id.toString();
      await moveToTrash('Task', deletedTaskId);
    });

    it('filters out soft-deleted records from countDocuments', async () => {
      const count = await Task.countDocuments({
        _id: { $in: [activeTaskId, deletedTaskId] },
      });
      expect(count).toBe(1);
    });

    it('filters out soft-deleted records from aggregation pipelines', async () => {
      const aggResult = await Task.aggregate([
        { $match: { _id: { $in: [new mongoose.Types.ObjectId(activeTaskId), new mongoose.Types.ObjectId(deletedTaskId)] } } },
        { $project: { title: 1, status: 1 } },
      ]);
      expect(aggResult.length).toBe(1);
      expect(aggResult[0].title).toBe('Active Task for Query Test');
    });

    it('filters out soft-deleted records from distinct queries', async () => {
      const statuses = await Task.distinct('status', {
        _id: { $in: [activeTaskId, deletedTaskId] },
      });
      expect(statuses).toEqual(['Inbox']);
    });

    it('prevents bulk updateMany from modifying soft-deleted items unless includeDeleted is specified', async () => {
      await Task.updateMany(
        { _id: { $in: [activeTaskId, deletedTaskId] } },
        { $set: { priority: 'urgent' } }
      );

      const activeTask = await Task.findById(activeTaskId);
      expect((activeTask as any)?.priority).toBe('urgent');

      const rawDeleted = await Task.collection.findOne({ _id: new mongoose.Types.ObjectId(deletedTaskId) });
      expect(rawDeleted?.priority).not.toBe('urgent');
    });
  });

  describe('8. Financial Transfer Soft-Deletion & Double-Entry Consistency', () => {
    let sourceAccount: any;
    let destAccount: any;
    let senderTxId: string;

    beforeAll(async () => {
      sourceAccount = await Account.create({
        userId: userAId,
        name: 'Transfer Source',
        type: 'checking',
        balance: 1000,
        currency: 'USD',
      });

      destAccount = await Account.create({
        userId: userAId,
        name: 'Transfer Dest',
        type: 'savings',
        balance: 500,
        currency: 'USD',
      });

      const transferRes = await createTransaction({
        amount: 200,
        currency: 'USD',
        date: new Date().toISOString(),
        accountId: sourceAccount._id.toString(),
        toAccountId: destAccount._id.toString(),
        description: 'Rent Split Transfer',
        type: 'transfer',
      });

      expect(transferRes.success).toBe(true);
      senderTxId = transferRes.transaction._id.toString();

      // Verify immediate balance adjustment: Source: 800, Dest: 700
      let src = await Account.findById(sourceAccount._id);
      let dst = await Account.findById(destAccount._id);
      expect(Number(src?.balance)).toBe(800);
      expect(Number(dst?.balance)).toBe(700);
    });

    it('reverses both accounts when a transfer is soft-deleted and restores both upon recovery', async () => {
      // Soft-delete sender leg of transfer
      const trashRes = await moveToTrash('Transaction', senderTxId);
      expect(trashRes.success).toBe(true);

      // Verify source account is refunded (+200 -> 1000) and dest is deducted (-200 -> 500)
      let src = await Account.findById(sourceAccount._id);
      let dst = await Account.findById(destAccount._id);
      expect(Number(src?.balance)).toBe(1000);
      expect(Number(dst?.balance)).toBe(500);

      // Find trash item for transfer
      const trashDoc = await TrashItem.findOne({ entityId: senderTxId, entityType: 'Transaction' });
      expect(trashDoc).not.toBeNull();

      // Restore transfer
      const restoreRes = await restoreFromTrash(trashDoc!._id.toString());
      expect(restoreRes.success).toBe(true);

      // Verify transfer re-applied: Source: 800, Dest: 700
      src = await Account.findById(sourceAccount._id);
      dst = await Account.findById(destAccount._id);
      expect(Number(src?.balance)).toBe(800);
      expect(Number(dst?.balance)).toBe(700);
    });
  });

  describe('9. Cloudinary Purge Failure Recovery & Retryable Tracking', () => {
    it('marks item as failed when Cloudinary asset purge errors and retries successfully', async () => {
      const failNote = await Note.create({
        userId: userAId,
        workspaceId: mockWorkspaceId,
        groupId: new mongoose.Types.ObjectId(),
        slug: 'note-with-failed-asset-' + Date.now(),
        title: 'Note with Unstable Asset',
        attachments: [
          {
            url: 'https://cloudinary.com/failing.pdf',
            publicId: 'manageo/user-a/failing-asset-123',
            resourceType: 'raw',
          },
        ],
      });

      await moveToTrash('Note', failNote._id.toString());
      const trashDoc = await TrashItem.findOne({ entityId: failNote._id.toString() });
      expect(trashDoc).not.toBeNull();

      // Simulate expired purge date
      await TrashItem.updateOne({ _id: trashDoc!._id }, { $set: { purgeAt: new Date(Date.now() - 1000) } });

      // Mock Cloudinary failing on first attempt
      mockDeleteAttachments.mockRejectedValueOnce(new Error('Cloudinary 503 Service Unavailable'));

      // Run purge
      const purge1 = await purgeExpiredTrash(100);
      expect(purge1.errors.length).toBeGreaterThanOrEqual(1);

      // Document in DB is preserved for safety (not orphaned)
      const noteStillInDb = await Note.collection.findOne({ _id: failNote._id });
      expect(noteStillInDb).not.toBeNull();

      // TrashItem record is in 'failed' status with retry count and error message
      const failedTrashItem = await TrashItem.findById(trashDoc!._id);
      expect(failedTrashItem?.status).toBe('failed');
      expect(failedTrashItem?.purgeAttempts).toBe(1);
      expect(failedTrashItem?.lastPurgeError).toContain('Cloudinary 503');

      // Next run: Cloudinary succeeds
      mockDeleteAttachments.mockResolvedValueOnce(true);
      const purge2 = await purgeExpiredTrash(100);
      expect(purge2.purgedCount).toBeGreaterThanOrEqual(1);

      // Now note is permanently purged from DB
      const noteGone = await Note.collection.findOne({ _id: failNote._id });
      expect(noteGone).toBeNull();
    });
  });

  describe('10. Concurrency & Protection against Restoring Purging Items', () => {
    it('rejects restoration if an item is currently being purged by background worker', async () => {
      const taskRes = await createTask({ title: 'Concurrent Race Task', status: 'Inbox' });
      const task = taskRes.task;
      await moveToTrash('Task', task._id.toString());

      const trashDoc = await TrashItem.findOne({ entityId: task._id.toString() });
      expect(trashDoc).not.toBeNull();

      // Simulate background worker transitioning state to 'purging'
      await TrashItem.updateOne({ _id: trashDoc!._id }, { $set: { status: 'purging' } });

      // Attempt to restore while purging
      const restoreAttempt = await restoreFromTrash(trashDoc!._id.toString());
      expect(restoreAttempt.success).toBe(false);
      expect(restoreAttempt.error).toContain('Trash item not found or already purged');
    });
  });

  describe('11. Partial Asset Failure Tracking & Safe Restoration Guard', () => {
    it('tracks per-asset deletion status and prevents restoring a record whose assets were partially deleted', async () => {
      const group = await NoteGroup.create({
        userId: userAId,
        workspaceId: mockWorkspaceId,
        name: 'Partial Asset Group',
        slug: 'partial-asset-group-' + Date.now(),
      });

      const partialNote = await Note.create({
        userId: userAId,
        workspaceId: mockWorkspaceId,
        groupId: group._id,
        slug: 'note-partial-asset-' + Date.now(),
        title: 'Note with Multiple Assets',
        attachments: [
          {
            url: 'https://cloudinary.com/asset1.png',
            publicId: 'manageo/user-a/asset1-success',
            resourceType: 'image',
          },
          {
            url: 'https://cloudinary.com/asset2.png',
            publicId: 'manageo/user-a/asset2-failing',
            resourceType: 'image',
          },
        ],
      });

      await moveToTrash('Note', partialNote._id.toString());
      const trashDoc = await TrashItem.findOne({ entityId: partialNote._id.toString() });
      expect(trashDoc).not.toBeNull();
      expect(trashDoc?.attachments?.[0].cleanupStatus).toBe('pending');
      expect(trashDoc?.attachments?.[1].cleanupStatus).toBe('pending');

      // Simulate expired purge date
      await TrashItem.updateOne({ _id: trashDoc!._id }, { $set: { purgeAt: new Date(Date.now() - 1000) } });

      // Mock: asset 1 deletion succeeds, asset 2 deletion throws Cloudinary 500 error
      mockDeleteAttachments
        .mockResolvedValueOnce(true)
        .mockRejectedValueOnce(new Error('Cloudinary 500 error on asset 2'));

      // Run background purge
      const purgeRun = await purgeExpiredTrash(100);
      expect(purgeRun.errors.length).toBeGreaterThanOrEqual(1);

      // Check updated TrashItem
      const updatedTrash = await TrashItem.findById(trashDoc!._id);
      expect(updatedTrash?.status).toBe('failed');
      expect(updatedTrash?.attachments?.[0].cleanupStatus).toBe('deleted');
      expect(updatedTrash?.attachments?.[1].cleanupStatus).toBe('failed');

      // Attempt to restore: MUST be rejected because asset 1 is already permanently deleted
      const restoreRes = await restoreFromTrash(trashDoc!._id.toString());
      expect(restoreRes.success).toBe(false);
      expect(
        restoreRes.error?.includes('permanently cleaned up') ||
        restoreRes.error?.includes('7-day retention period') ||
        restoreRes.error?.includes('cannot be restored')
      ).toBe(true);

      // Subsequent retry of purge: asset 1 is skipped (already deleted), only asset 2 is retried
      mockDeleteAttachments.mockResolvedValueOnce(true);
      const retryRun = await purgeExpiredTrash(100);
      expect(retryRun.purgedCount).toBeGreaterThanOrEqual(1);

      // Now completely purged
      const finalDoc = await Note.collection.findOne({ _id: partialNote._id });
      expect(finalDoc).toBeNull();
    });
  });

  describe('12. Cross-Model Shared Asset Retention across Collections', () => {
    it('detects shared assets across models and retains them without deleting from Cloudinary', async () => {
      const { isAssetReferencedAcrossModels } = await import('@/actions/trash.actions');
      const TaskComment = (await import('@/models/TaskComment')).default;

      const sharedPublicId = 'manageo/shared-asset-999';

      // Create a Task that references the asset
      const task = await Task.create({
        userId: userAId,
        workspaceId: mockWorkspaceId,
        slug: 'task-referencing-shared-asset-' + Date.now(),
        title: 'Task referencing shared asset',
        status: 'Inbox',
        attachments: [
          {
            url: 'https://cloudinary.com/shared.pdf',
            publicId: sharedPublicId,
            resourceType: 'raw',
          },
        ],
      });

      // Active reference exists
      const isShared1 = await isAssetReferencedAcrossModels(sharedPublicId);
      expect(isShared1).toBe(true);

      // Excluding task itself: no other reference
      const isSharedExcludingTask = await isAssetReferencedAcrossModels(sharedPublicId, task._id);
      expect(isSharedExcludingTask).toBe(false);

      // Now create a TaskComment referencing the same asset
      const comment = await TaskComment.create({
        taskId: task._id,
        workspaceId: mockWorkspaceId,
        userId: userAId,
        content: 'Check this shared attachment',
        attachments: [
          {
            url: 'https://cloudinary.com/shared.pdf',
            publicId: sharedPublicId,
            resourceType: 'raw',
          },
        ],
      });

      // Now even excluding the task, the asset is still referenced in TaskComment!
      const isSharedNow = await isAssetReferencedAcrossModels(sharedPublicId, task._id);
      expect(isSharedNow).toBe(true);

      // Clean up TaskComment
      await TaskComment.deleteOne({ _id: comment._id });
      await Task.deleteOne({ _id: task._id });
    });
  });

  describe('13. Strict 7-Day Retention Expiration Rejection', () => {
    it('strictly rejects restoration when 7-day retention period has lapsed even if status is active', async () => {
      const expiredTaskRes = await createTask({ title: 'Expired Retention Task', status: 'Inbox' });
      const task = expiredTaskRes.task;
      await moveToTrash('Task', task._id.toString());

      const trashDoc = await TrashItem.findOne({ entityId: task._id.toString() });
      expect(trashDoc).not.toBeNull();

      // Force purgeAt into the past (expired retention) while keeping status 'active'
      await TrashItem.updateOne({ _id: trashDoc!._id }, { $set: { purgeAt: new Date(Date.now() - 5000) } });

      const restoreAttempt = await restoreFromTrash(trashDoc!._id.toString());
      expect(restoreAttempt.success).toBe(false);
      expect(restoreAttempt.error).toContain('7-day retention period');
    });
  });


  describe('14. Aggregation Pipeline Ordering and First-Stage Preservation', () => {
    it('preserves $search, $vectorSearch, or $geoNear as first stage and splices $match at index 1', async () => {
      // Construct aggregation pipeline starting with $search
      const agg = Task.aggregate([
        { $search: { index: 'default', text: { query: 'test', path: 'title' } } } as any,
        { $project: { title: 1 } },
      ]);
      // Trigger Mongoose pre('aggregate') hooks
      await agg.exec().catch(() => {});

      const pipeline = agg.pipeline();
      expect(pipeline[0]).toHaveProperty('$search');
      expect(pipeline[1]).toEqual({ $match: { isDeleted: { $ne: true } } });
      expect(pipeline[2]).toHaveProperty('$project');
    });

    it('preserves explicit isDeleted condition when already present in first stage $match', async () => {
      const agg = Task.aggregate([
        { $match: { isDeleted: true, status: 'Inbox' } },
        { $count: 'totalDeleted' },
      ]);
      // Trigger Mongoose pre('aggregate') hooks
      await agg.exec().catch(() => {});

      const pipeline = agg.pipeline();
      expect(pipeline[0]).toEqual({ $match: { isDeleted: true, status: 'Inbox' } });
      expect(pipeline.length).toBe(2);
    });

    it('excludes soft-deleted records from findOneAndUpdate and findByIdAndUpdate', async () => {
      const task = await Task.create({
        userId: userAId,
        workspaceId: mockWorkspaceId,
        title: 'Task for Update Hooks',
        slug: 'task-update-hooks-' + Date.now(),
        status: 'Inbox',
      });

      await moveToTrash('Task', task._id.toString());

      // Attempt findOneAndUpdate on soft-deleted record without includeDeleted
      const updated1 = await Task.findOneAndUpdate(
        { _id: task._id },
        { $set: { title: 'Should Not Update' } },
        { new: true }
      );
      expect(updated1).toBeNull();

      // Attempt findByIdAndUpdate on soft-deleted record without includeDeleted
      const updated2 = await Task.findByIdAndUpdate(
        task._id,
        { $set: { title: 'Should Not Update Either' } },
        { new: true }
      );
      expect(updated2).toBeNull();
    });
  });

  describe('15. Cron Purge Endpoint Authorization and Fail-Closed Protection', () => {
    it('rejects unauthorized calls with HTTP 401 when Bearer token is missing or invalid', async () => {
      const { GET } = await import('@/app/api/cron/trash-purge/route');

      // Missing header
      const reqNoAuth = new Request('http://localhost:3000/api/cron/trash-purge');
      const resNoAuth = await GET(reqNoAuth);
      expect(resNoAuth.status).toBe(401);

      // Wrong token
      const reqBadAuth = new Request('http://localhost:3000/api/cron/trash-purge', {
        headers: { authorization: 'Bearer wrong-secret-token' },
      });
      const resBadAuth = await GET(reqBadAuth);
      expect(resBadAuth.status).toBe(401);
    });

    it('fails closed with HTTP 500 when CRON_SECRET is unconfigured on the server', async () => {
      const { GET } = await import('@/app/api/cron/trash-purge/route');
      const origSecret = process.env.CRON_SECRET;
      try {
        delete process.env.CRON_SECRET;
        const req = new Request('http://localhost:3000/api/cron/trash-purge', {
          headers: { authorization: 'Bearer any-token' },
        });
        const res = await GET(req);
        expect(res.status).toBe(500);
        const data = await res.json();
        expect(data.error).toContain('CRON_SECRET missing');
      } finally {
        process.env.CRON_SECRET = origSecret;
      }
    });

    it('executes purge and returns HTTP 200 when authorized with genuine CRON_SECRET', async () => {
      const { GET } = await import('@/app/api/cron/trash-purge/route');
      process.env.CRON_SECRET = process.env.CRON_SECRET || 'test-cron-secret-2026';

      const req = new Request('http://localhost:3000/api/cron/trash-purge', {
        headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
      });
      const res = await GET(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(typeof data.purgedCount).toBe('number');
    });
  });
  describe('16. Cloudinary System-Operation Authorization & Client-Bypass Protection', () => {
    it('rejects unauthenticated callers to deleteAttachments even if rogue isSystem option is supplied', async () => {
      const { deleteAttachments } = jest.requireActual('@/actions/cloudinary.actions');
      mockGetServerSession.mockResolvedValueOnce(null); // Unauthenticated

      // Pass rogue argument as untrusted client would attempt
      await expect(
        (deleteAttachments as any)([{ publicId: 'rogue-asset-123' }], { isSystem: true })
      ).rejects.toThrow('Unauthorized');
    });

    it('rejects unauthenticated callers to deleteImage even if rogue isSystem option is supplied', async () => {
      const { deleteImage } = jest.requireActual('@/actions/cloudinary.actions');
      mockGetServerSession.mockResolvedValueOnce(null); // Unauthenticated

      // Pass rogue argument as untrusted client would attempt
      const result = await (deleteImage as any)('rogue-image-123', { isSystem: true });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });

    it('systemDeleteAttachments rejects execution without valid CRON_SECRET authorization', async () => {
      const { systemDeleteAttachments } = jest.requireActual('@/lib/cloudinary-internal');

      // 1. Missing token
      await expect(
        systemDeleteAttachments([{ publicId: 'sys-asset-1' }])
      ).rejects.toThrow('Unauthorized system operation: invalid or missing system authorization token');

      // 2. Wrong token
      await expect(
        systemDeleteAttachments([{ publicId: 'sys-asset-1' }], 'wrong-token')
      ).rejects.toThrow('Unauthorized system operation: invalid or missing system authorization token');
    });

    it('systemDeleteImage rejects execution without valid CRON_SECRET authorization', async () => {
      const { systemDeleteImage } = jest.requireActual('@/lib/cloudinary-internal');

      // Missing token
      await expect(
        systemDeleteImage('sys-image-1')
      ).rejects.toThrow('Unauthorized system operation: invalid or missing system authorization token');

      // Wrong token
      await expect(
        systemDeleteImage('sys-image-1', 'bad-token')
      ).rejects.toThrow('Unauthorized system operation: invalid or missing system authorization token');
    });
  });

  describe('17. Complete Soft-Delete Mutation Coverage & Client Query Bypass Neutralization', () => {
    it('protects soft-deleted records from findOneAndDelete and findByIdAndDelete', async () => {
      const task = await Task.create({
        userId: userAId,
        workspaceId: mockWorkspaceId,
        title: 'Task For findOneAndDelete Test',
        slug: 'task-fod-' + Date.now(),
        status: 'Inbox',
      });

      await moveToTrash('Task', task._id.toString());

      // Attempt findOneAndDelete on soft-deleted record without includeDeleted
      const resFod = await Task.findOneAndDelete({ _id: task._id });
      expect(resFod).toBeNull();

      // Attempt findByIdAndDelete on soft-deleted record without includeDeleted
      const resFbid = await Task.findByIdAndDelete(task._id);
      expect(resFbid).toBeNull();

      // Verify the task is still in MongoDB
      const rawDoc = await Task.findById(task._id).setOptions({ includeDeleted: true });
      expect(rawDoc).not.toBeNull();
      expect(rawDoc?.isDeleted).toBe(true);
    });

    it('protects soft-deleted records from findOneAndReplace', async () => {
      const task = await Task.create({
        userId: userAId,
        workspaceId: mockWorkspaceId,
        title: 'Task For findOneAndReplace Test',
        slug: 'task-foar-' + Date.now(),
        status: 'Inbox',
      });

      await moveToTrash('Task', task._id.toString());

      const resReplace = await Task.findOneAndReplace(
        { _id: task._id },
        { title: 'Replaced Title', userId: userAId, workspaceId: mockWorkspaceId, slug: 'replaced-slug' }
      );
      expect(resReplace).toBeNull();

      // Verify document still has original title
      const rawDoc = await Task.findById(task._id).setOptions({ includeDeleted: true });
      expect(rawDoc?.title).toBe('Task For findOneAndReplace Test');
    });

    it('neutralizes untrusted client input supplying isDeleted: true in query filters', async () => {
      const task = await Task.create({
        userId: userAId,
        workspaceId: mockWorkspaceId,
        title: 'Task For Untrusted Query Test',
        slug: 'task-untrusted-' + Date.now(),
        status: 'Inbox',
      });

      await moveToTrash('Task', task._id.toString());

      // Untrusted client sends isDeleted: true in query filter
      const foundList = await Task.find({ _id: task._id, isDeleted: true });
      expect(foundList).toHaveLength(0);

      const foundOne = await Task.findOne({ _id: task._id, isDeleted: true });
      expect(foundOne).toBeNull();

      const count = await Task.countDocuments({ _id: task._id, isDeleted: true });
      expect(count).toBe(0);

      const updateRes = await Task.findOneAndUpdate(
        { _id: task._id, isDeleted: true },
        { $set: { title: 'Illicitly Mutated' } }
      );
      expect(updateRes).toBeNull();

      // Raw document retains title
      const checkDoc = await Task.findById(task._id).setOptions({ includeDeleted: true });
      expect(checkDoc?.title).toBe('Task For Untrusted Query Test');
    });

  });
});

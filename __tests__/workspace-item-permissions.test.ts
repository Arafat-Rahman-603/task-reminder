import 'dotenv/config';
import mongoose from 'mongoose';
import { 
  canUserViewItem, 
  canUserEditItem, 
  canUserManageItemPermissions, 
  buildVisibilityMongoFilter 
} from '@/lib/itemPermissions';

describe('Workspace Item Permissions & Granular Access Control', () => {
  const creatorId = '605c72ef1f2b2a001f3b4d5a';
  const member1Id = '605c72ef1f2b2a001f3b4d5b';
  const member2Id = '605c72ef1f2b2a001f3b4d5c';
  const adminId   = '605c72ef1f2b2a001f3b4d5d';

  describe('canUserViewItem', () => {
    it('allows workspace owners and admins to view any item', () => {
      const privateItem = {
        userId: creatorId,
        visibility: 'private' as const,
      };

      expect(canUserViewItem({ item: privateItem, userId: adminId, userRole: 'owner' })).toBe(true);
      expect(canUserViewItem({ item: privateItem, userId: adminId, userRole: 'admin' })).toBe(true);
    });

    it('allows creator to view their own private or restricted items', () => {
      const privateItem = {
        userId: creatorId,
        visibility: 'private' as const,
      };
      const restrictedItem = {
        userId: creatorId,
        visibility: 'restricted' as const,
        visibleToMembers: [new mongoose.Types.ObjectId(member1Id)],
      };

      expect(canUserViewItem({ item: privateItem, userId: creatorId, userRole: 'member' })).toBe(true);
      expect(canUserViewItem({ item: restrictedItem, userId: creatorId, userRole: 'member' })).toBe(true);
    });

    it('allows all members to view workspace-visible items and legacy items without visibility set', () => {
      const workspaceItem = {
        userId: creatorId,
        visibility: 'workspace' as const,
      };
      const legacyItem = {
        userId: creatorId,
      };

      expect(canUserViewItem({ item: workspaceItem, userId: member1Id, userRole: 'member' })).toBe(true);
      expect(canUserViewItem({ item: legacyItem, userId: member1Id, userRole: 'member' })).toBe(true);
    });

    it('blocks other members from viewing private items', () => {
      const privateItem = {
        userId: creatorId,
        visibility: 'private' as const,
      };

      expect(canUserViewItem({ item: privateItem, userId: member1Id, userRole: 'member' })).toBe(false);
      expect(canUserViewItem({ item: privateItem, userId: member2Id, userRole: 'member' })).toBe(false);
    });

    it('allows only explicitly permitted members to view restricted items', () => {
      const restrictedItem = {
        userId: creatorId,
        visibility: 'restricted' as const,
        visibleToMembers: [member1Id],
      };

      expect(canUserViewItem({ item: restrictedItem, userId: member1Id, userRole: 'member' })).toBe(true);
      expect(canUserViewItem({ item: restrictedItem, userId: member2Id, userRole: 'member' })).toBe(false);
    });
  });

  describe('canUserEditItem', () => {
    it('forbids viewer role from editing any item under any circumstances', () => {
      const item = {
        userId: creatorId,
        editableBy: 'workspace' as const,
      };

      expect(canUserEditItem({ item, userId: member1Id, userRole: 'viewer' })).toBe(false);
      expect(canUserEditItem({ item, userId: creatorId, userRole: 'viewer' })).toBe(false);
    });

    it('allows owners and admins to edit any item', () => {
      const creatorOnlyItem = {
        userId: creatorId,
        editableBy: 'creator_only' as const,
      };

      expect(canUserEditItem({ item: creatorOnlyItem, userId: adminId, userRole: 'owner' })).toBe(true);
      expect(canUserEditItem({ item: creatorOnlyItem, userId: adminId, userRole: 'admin' })).toBe(true);
    });

    it('allows creators to edit their own items regardless of editableBy setting', () => {
      const creatorOnlyItem = {
        userId: creatorId,
        editableBy: 'creator_only' as const,
      };
      const restrictedItem = {
        userId: creatorId,
        editableBy: 'restricted' as const,
        editableByMembers: [member1Id],
      };

      expect(canUserEditItem({ item: creatorOnlyItem, userId: creatorId, userRole: 'member' })).toBe(true);
      expect(canUserEditItem({ item: restrictedItem, userId: creatorId, userRole: 'member' })).toBe(true);
    });

    it('allows members to edit workspace-editable items', () => {
      const workspaceItem = {
        userId: creatorId,
        editableBy: 'workspace' as const,
      };

      expect(canUserEditItem({ item: workspaceItem, userId: member1Id, userRole: 'member' })).toBe(true);
    });

    it('blocks regular members from editing creator_only items', () => {
      const creatorOnlyItem = {
        userId: creatorId,
        editableBy: 'creator_only' as const,
      };

      expect(canUserEditItem({ item: creatorOnlyItem, userId: member1Id, userRole: 'member' })).toBe(false);
    });

    it('allows only explicitly listed members to edit restricted items', () => {
      const restrictedItem = {
        userId: creatorId,
        editableBy: 'restricted' as const,
        editableByMembers: [member1Id],
      };

      expect(canUserEditItem({ item: restrictedItem, userId: member1Id, userRole: 'member' })).toBe(true);
      expect(canUserEditItem({ item: restrictedItem, userId: member2Id, userRole: 'member' })).toBe(false);
    });
  });

  describe('canUserManageItemPermissions', () => {
    it('allows owners, admins, and creator to manage permissions', () => {
      const item = {
        userId: creatorId,
      };

      expect(canUserManageItemPermissions({ item, userId: adminId, userRole: 'owner' })).toBe(true);
      expect(canUserManageItemPermissions({ item, userId: adminId, userRole: 'admin' })).toBe(true);
      expect(canUserManageItemPermissions({ item, userId: creatorId, userRole: 'member' })).toBe(true);
    });

    it('blocks regular members from altering permissions even if they have content edit rights', () => {
      const item = {
        userId: creatorId,
        editableBy: 'workspace' as const,
      };

      expect(canUserManageItemPermissions({ item, userId: member1Id, userRole: 'member' })).toBe(false);
    });
  });

  describe('buildVisibilityMongoFilter', () => {
    it('returns empty filter for owners and admins (they see all items)', () => {
      expect(buildVisibilityMongoFilter(adminId, 'owner')).toEqual({});
      expect(buildVisibilityMongoFilter(adminId, 'admin')).toEqual({});
    });

    it('builds an $or query for regular members encompassing own items, workspace items, and restricted items', () => {
      const filter = buildVisibilityMongoFilter(member1Id, 'member');
      expect(filter).toHaveProperty('$or');
      expect(Array.isArray(filter.$or)).toBe(true);

      const conditions = filter.$or;
      // Should include own items
      expect(conditions.some((c: any) => c.userId && c.userId.toString() === member1Id)).toBe(true);
      // Should include workspace items
      expect(conditions.some((c: any) => c.visibility === 'workspace')).toBe(true);
      // Should include legacy items
      expect(conditions.some((c: any) => c.visibility && c.visibility.$exists === false)).toBe(true);
      // Should include restricted items where member is present in visibleToMembers
      expect(conditions.some((c: any) => c.visibility === 'restricted')).toBe(true);
    });
  });
});

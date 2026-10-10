import 'dotenv/config';
import mongoose from 'mongoose';
import { createTask, updateTask, deleteTask } from '@/actions/task.actions';
import { createRoutine, updateRoutine, deleteRoutine } from '@/actions/routine.actions';
import { createNote, updateNote, deleteNote } from '@/actions/note.actions';
import { createIdea, updateIdea, deleteIdea } from '@/actions/idea.actions';
import Task from '@/models/Task';
import Routine from '@/models/Routine';
import Note from '@/models/Note';
import Idea from '@/models/Idea';

// Mock workspace info
const mockWorkspaceId = new mongoose.Types.ObjectId();
const testUserId = '605c72ef1f2b2a001f3b4d5a';

jest.mock('../src/actions/workspace.actions', () => ({
  getActiveWorkspaceInfo: jest.fn().mockResolvedValue({
    activeWorkspace: { _id: '605c72ef1f2b2a001f3b4d5b' }
  })
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn().mockResolvedValue({
    user: { id: '605c72ef1f2b2a001f3b4d5a' }
  })
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn()
}));

import dbConnect from '@/lib/db';

describe('Phase 2: Functional Depth (CRUD Operations)', () => {

  beforeAll(async () => {
    await dbConnect();
  });

  afterAll(async () => {
    await Task.deleteMany({ workspaceId: mockWorkspaceId });
    await Routine.deleteMany({ workspaceId: mockWorkspaceId });
    await Note.deleteMany({ workspaceId: mockWorkspaceId });
    await Idea.deleteMany({ workspaceId: mockWorkspaceId });
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  describe('Tasks', () => {
    let taskId: string;

    it('should create a task', async () => {
      const result = await createTask({ title: 'Test Task Phase 2', status: 'Inbox' });
      expect(result).toEqual(expect.objectContaining({ success: true }));
      taskId = result.task._id;
    });

    it('should update a task', async () => {
      const result = await updateTask(taskId, { title: 'Updated Test Task', status: 'In Progress' });
      expect(result).toEqual(expect.objectContaining({ success: true }));
      const task = await Task.findById(taskId);
      expect(task?.title).toBe('Updated Test Task');
      expect(task?.status).toBe('In Progress');
    });

    it('should delete a task', async () => {
      const result = await deleteTask(taskId);
      expect(result).toEqual(expect.objectContaining({ success: true }));
      const task = await Task.findById(taskId);
      expect(task).toBeNull();
    });
  });

  describe('Routines', () => {
    let routineId: string;

    it('should create a routine', async () => {
      const result = await createRoutine({ name: 'Test Routine Phase 2', frequency: 'Daily' });
      expect(result).toEqual(expect.objectContaining({ success: true }));
      routineId = result.routine._id;
    });

    it('should update a routine', async () => {
      const result = await updateRoutine(routineId, { name: 'Updated Test Routine' });
      expect(result).toEqual(expect.objectContaining({ success: true }));
      const routine = await Routine.findById(routineId);
      expect(routine?.name).toBe('Updated Test Routine');
    });

    it('should delete a routine', async () => {
      const result = await deleteRoutine(routineId);
      expect(result).toEqual(expect.objectContaining({ success: true }));
      const routine = await Routine.findById(routineId);
      expect(routine).toBeNull();
    });
  });

  describe('Notes', () => {
    let noteId: string;
    let groupId: string;

    it('should create a note', async () => {
      // First create a NoteGroup
      const { createNoteGroup } = require('../src/actions/note.actions');
      const groupRes = await createNoteGroup({ name: 'Test Group' });
      expect(groupRes.success).toBe(true);
      groupId = groupRes.group._id;

      const result = await createNote(groupId, { title: 'Test Note', content: 'Phase 2 Testing' });
      expect(result).toEqual(expect.objectContaining({ success: true }));
      noteId = result.note._id;
    });

    it('should update a note', async () => {
      const result = await updateNote(noteId, { content: 'Updated Content' });
      expect(result).toEqual(expect.objectContaining({ success: true }));
      const note = await Note.findById(noteId);
      expect(note?.content).toBe('Updated Content');
    });

    it('should delete a note', async () => {
      const result = await deleteNote(noteId);
      expect(result).toEqual(expect.objectContaining({ success: true }));
      const note = await Note.findById(noteId);
      expect(note).toBeNull();
    });
  });

  describe('Ideas', () => {
    let ideaId: string;

    it('should create an idea', async () => {
      const result = await createIdea({ title: 'Test Idea Phase 2', status: 'Inbox' });
      expect(result).toEqual(expect.objectContaining({ success: true }));
      ideaId = result.idea._id;
    });

    it('should update an idea', async () => {
      const result = await updateIdea(ideaId, { title: 'Updated Idea' });
      expect(result).toEqual(expect.objectContaining({ success: true }));
      const idea = await Idea.findById(ideaId);
      expect(idea?.title).toBe('Updated Idea');
    });

    it('should delete an idea', async () => {
      const result = await deleteIdea(ideaId);
      expect(result).toEqual(expect.objectContaining({ success: true }));
      const idea = await Idea.findById(ideaId);
      expect(idea).toBeNull();
    });
  });
});

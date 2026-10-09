import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Workspace from '@/models/Workspace';
import WorkspaceMembership from '@/models/WorkspaceMembership';
import Task from '@/models/Task';
import Note from '@/models/Note';
import NoteGroup from '@/models/NoteGroup';
import Idea from '@/models/Idea';
import Routine from '@/models/Routine';
import CustomSection from '@/models/custom/CustomSection';
import CustomRecord from '@/models/custom/CustomRecord';
import TaskHistory from '@/models/TaskHistory';
import RoutineHistory from '@/models/RoutineHistory';
import User from '@/models/User';

export async function GET() {
  try {
    await dbConnect();
    
    const results = [];
    
    // 1. Ensure all users have a Personal Workspace
    const users = await User.find({}).lean();
    let createdWorkspaces = 0;
    
    for (const user of users) {
      let ws = await Workspace.findOne({ ownerId: user._id, type: "personal" });
      if (!ws) {
        ws = await Workspace.create({
          name: "Personal Workspace",
          type: "personal",
          ownerId: user._id
        });
        createdWorkspaces++;
      }
      
      // Ensure owner membership
      const membership = await WorkspaceMembership.findOne({ workspaceId: ws._id, userId: user._id });
      if (!membership) {
        await WorkspaceMembership.create({
          workspaceId: ws._id,
          userId: user._id,
          role: "owner"
        });
      }
    }

    results.push(`Created ${createdWorkspaces} personal workspaces.`);

    // 2. Backfill workspaceId on collaborative models
    const modelsToMigrate = [
      { name: 'Task', model: Task },
      { name: 'NoteGroup', model: NoteGroup },
      { name: 'Note', model: Note },
      { name: 'Idea', model: Idea },
      { name: 'Routine', model: Routine },
      { name: 'CustomSection', model: CustomSection },
      { name: 'CustomRecord', model: CustomRecord },
      { name: 'TaskHistory', model: TaskHistory },
      { name: 'RoutineHistory', model: RoutineHistory },
    ];

    for (const { name, model } of modelsToMigrate) {
      const records = await model.find({ workspaceId: { $exists: false } });
      let migratedCount = 0;
      
      for (const record of records) {
        if (record.userId) {
          // Find their personal workspace
          const ws = await Workspace.findOne({ ownerId: record.userId, type: "personal" });
          if (ws) {
            await model.updateOne({ _id: record._id }, { $set: { workspaceId: ws._id } });
            migratedCount++;
          }
        }
      }
      results.push(`Migrated ${migratedCount} ${name} records.`);
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, stack: error.stack }, { status: 500 });
  }
}

import 'dotenv/config';
require('dotenv').config({ path: '.env.local', override: true });
import mongoose from 'mongoose';
import dbConnect from './src/lib/db';

// Models
import Workspace from './src/models/Workspace';
import WorkspaceMembership from './src/models/WorkspaceMembership';
import Task from './src/models/Task';
import Note from './src/models/Note';
import NoteGroup from './src/models/NoteGroup';
import Idea from './src/models/Idea';
import Routine from './src/models/Routine';
import CustomSection from './src/models/custom/CustomSection';
import CustomRecord from './src/models/custom/CustomRecord';
import TaskHistory from './src/models/TaskHistory';
import RoutineHistory from './src/models/RoutineHistory';
import User from './src/models/User';

async function migrate() {
  await dbConnect();
  console.log("Starting Migration to Phase 1 (Workspaces)...");
  
  // 1. Ensure all users have a Personal Workspace
  const users = await User.find({}).lean();
  console.log(`Found ${users.length} users. Checking Personal Workspaces...`);
  
  for (const user of users) {
    let ws = await Workspace.findOne({ ownerId: user._id, type: "personal" });
    if (!ws) {
      console.log(`Creating Personal Workspace for user: ${user.email}`);
      ws = await Workspace.create({
        name: "Personal Workspace",
        type: "personal",
        ownerId: user._id
      });
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
    console.log(`Migrating ${name}...`);
    const records = await model.find({ workspaceId: { $exists: false } });
    console.log(`Found ${records.length} ${name} records lacking workspaceId.`);
    let migratedCount = 0;
    
    for (const record of records) {
      if (record.userId) {
        // Find their personal workspace
        const ws = await Workspace.findOne({ ownerId: record.userId, type: "personal" });
        if (ws) {
          record.workspaceId = ws._id;
          await record.save();
          migratedCount++;
        } else {
          console.error(`Orphan record ${record._id} in ${name}: User ${record.userId} has no personal workspace!`);
        }
      } else {
        console.warn(`Record ${record._id} in ${name} lacks both userId and workspaceId!`);
      }
    }
    console.log(`Migrated ${migratedCount} ${name} records.`);
  }

  console.log("Migration Complete.");
  process.exit(0);
}

migrate().catch(e => {
  console.error("Migration Failed:", e);
  process.exit(1);
});

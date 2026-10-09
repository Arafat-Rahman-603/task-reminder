import mongoose from "mongoose";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import User from "../models/User";
import Workspace from "../models/Workspace";
import WorkspaceMembership from "../models/WorkspaceMembership";
import Task from "../models/Task";
import NoteGroup from "../models/NoteGroup";
import Note from "../models/Note";
import Idea from "../models/Idea";
import Routine from "../models/Routine";
import CustomSection from "../models/custom/CustomSection";
import CustomRecord from "../models/custom/CustomRecord";

async function runMigration() {
  const isDryRun = process.argv.includes("--dry-run");
  console.log("\n--- Starting Workspace Migration  ---\n");

  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is missing.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  const users = await User.find({});
  console.log("Found  users.");

  let createdWorkspaces = 0;
  let createdMemberships = 0;
  let migratedTasks = 0;
  let migratedNoteGroups = 0;
  let migratedNotes = 0;
  let migratedIdeas = 0;
  let migratedRoutines = 0;
  let migratedCustomSections = 0;
  let migratedCustomRecords = 0;

  for (const user of users) {
    // 1. Check if personal workspace exists
    let personalWorkspace = await Workspace.findOne({ ownerId: user._id, type: "personal" });
    
    if (!personalWorkspace) {
      if (!isDryRun) {
        personalWorkspace = await Workspace.create({
          name: "Personal Workspace",
          type: "personal",
          ownerId: user._id,
        });
      }
      createdWorkspaces++;
    }

    // 2. Check if membership exists
    if (personalWorkspace) {
      const membership = await WorkspaceMembership.findOne({ workspaceId: personalWorkspace._id, userId: user._id });
      if (!membership) {
        if (!isDryRun) {
          await WorkspaceMembership.create({
            workspaceId: personalWorkspace._id,
            userId: user._id,
            role: "owner",
          });
        }
        createdMemberships++;
      }
    }

    // 3. Migrate Records if we have a target workspace (or fake ID in dry run)
    const targetWorkspaceId = personalWorkspace ? personalWorkspace._id : "DRY_RUN_WORKSPACE_ID";
    
    // Count unmigrated records
    const unmigratedTasksCount = await Task.countDocuments({ userId: user._id, workspaceId: { $exists: false } });
    migratedTasks += unmigratedTasksCount;
    if (!isDryRun && unmigratedTasksCount > 0 && personalWorkspace) {
      await Task.updateMany({ userId: user._id, workspaceId: { $exists: false } }, { $set: { workspaceId: targetWorkspaceId } });
    }

    const unmigratedNoteGroupsCount = await NoteGroup.countDocuments({ userId: user._id, workspaceId: { $exists: false } });
    migratedNoteGroups += unmigratedNoteGroupsCount;
    if (!isDryRun && unmigratedNoteGroupsCount > 0 && personalWorkspace) {
      await NoteGroup.updateMany({ userId: user._id, workspaceId: { $exists: false } }, { $set: { workspaceId: targetWorkspaceId } });
    }

    const unmigratedNotesCount = await Note.countDocuments({ userId: user._id, workspaceId: { $exists: false } });
    migratedNotes += unmigratedNotesCount;
    if (!isDryRun && unmigratedNotesCount > 0 && personalWorkspace) {
      await Note.updateMany({ userId: user._id, workspaceId: { $exists: false } }, { $set: { workspaceId: targetWorkspaceId } });
    }

    const unmigratedIdeasCount = await Idea.countDocuments({ userId: user._id, workspaceId: { $exists: false } });
    migratedIdeas += unmigratedIdeasCount;
    if (!isDryRun && unmigratedIdeasCount > 0 && personalWorkspace) {
      await Idea.updateMany({ userId: user._id, workspaceId: { $exists: false } }, { $set: { workspaceId: targetWorkspaceId } });
    }

    const unmigratedRoutinesCount = await Routine.countDocuments({ userId: user._id, workspaceId: { $exists: false } });
    migratedRoutines += unmigratedRoutinesCount;
    if (!isDryRun && unmigratedRoutinesCount > 0 && personalWorkspace) {
      await Routine.updateMany({ userId: user._id, workspaceId: { $exists: false } }, { $set: { workspaceId: targetWorkspaceId } });
    }

    const unmigratedCustomSectionsCount = await CustomSection.countDocuments({ userId: user._id, workspaceId: { $exists: false } });
    migratedCustomSections += unmigratedCustomSectionsCount;
    if (!isDryRun && unmigratedCustomSectionsCount > 0 && personalWorkspace) {
      await CustomSection.updateMany({ userId: user._id, workspaceId: { $exists: false } }, { $set: { workspaceId: targetWorkspaceId } });
    }

    const unmigratedCustomRecordsCount = await CustomRecord.countDocuments({ userId: user._id, workspaceId: { $exists: false } });
    migratedCustomRecords += unmigratedCustomRecordsCount;
    if (!isDryRun && unmigratedCustomRecordsCount > 0 && personalWorkspace) {
      await CustomRecord.updateMany({ userId: user._id, workspaceId: { $exists: false } }, { $set: { workspaceId: targetWorkspaceId } });
    }
  }

  console.log("\n--- Migration Report ---");
  console.log("Workspaces to create: ");
  console.log("Memberships to create: ");
  console.log("Tasks to migrate: ");
  console.log("NoteGroups to migrate: ");
  console.log("Notes to migrate: ");
  console.log("Ideas to migrate: ");
  console.log("Routines to migrate: ");
  console.log("Custom Sections to migrate: ");
  console.log("Custom Records to migrate: ");

  if (isDryRun) {
    console.log("\nThis was a dry run. No data was modified.");
    console.log("To execute, run without the --dry-run flag.");
  } else {
    console.log("\nMigration completed successfully.");
  }

  process.exit(0);
}

runMigration().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});

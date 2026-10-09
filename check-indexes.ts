import 'dotenv/config';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import mongoose from 'mongoose';
import dbConnect from './src/lib/db';
import Workspace from './src/models/Workspace';
import WorkspaceMembership from './src/models/WorkspaceMembership';

async function checkIndexes() {
  await dbConnect();
  try {
    const wsIndexes = await Workspace.collection.indexes();
    console.log('Workspace Indexes:', wsIndexes);
  } catch (e: any) { console.error("WS Indexes error", e.message); }
  
  try {
    const wmIndexes = await WorkspaceMembership.collection.indexes();
    console.log('WorkspaceMembership Indexes:', wmIndexes);
  } catch (e: any) { console.error("WM Indexes error", e.message); }
  process.exit(0);
}
checkIndexes();

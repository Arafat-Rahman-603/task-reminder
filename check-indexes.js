require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local', override: true });
const { MongoClient } = require('mongodb');

async function run() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const wsIndexes = await db.collection('workspaces').indexes();
    console.log('Workspaces Indexes:', wsIndexes);
    const wmIndexes = await db.collection('workspacememberships').indexes();
    console.log('WorkspaceMemberships Indexes:', wmIndexes);
  } finally {
    await client.close();
  }
}
run();

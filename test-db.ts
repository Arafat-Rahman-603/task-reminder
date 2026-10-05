import mongoose from 'mongoose';
import User from './src/models/User';

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/test');
  const u = await User.findOne();
  console.log('Before:', u.preferences.vaultSettings);
  
  const res = await User.updateOne(
    { _id: u._id },
    { $set: { "preferences.vaultSettings.isInitialized": true, "preferences.vaultSettings.vaultPasswordHash": "test_hash" } }
  );
  console.log('Update result:', res);
  
  const u2 = await User.findOne();
  console.log('After:', u2.preferences.vaultSettings);
  process.exit(0);
};

run();

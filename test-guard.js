const processEnvBackup = { ...process.env };

async function testGuard() {
  const dbConnect = require('./src/lib/db').default;
  
  // Test 1: Missing TEST_MONGODB_URI
  process.env.NODE_ENV = 'test';
  delete process.env.TEST_MONGODB_URI;
  
  try {
    await dbConnect();
    console.error('Test 1 failed: did not throw');
  } catch (e) {
    if (e.message.includes('TEST_MONGODB_URI is not set')) {
      console.log('Test 1 passed');
    } else {
      console.error('Test 1 failed with wrong error', e);
    }
  }

  // Test 2: Matches MONGODB_URI
  process.env.MONGODB_URI = 'mongodb+srv://prod';
  process.env.TEST_MONGODB_URI = 'mongodb+srv://prod';
  
  try {
    await dbConnect();
    console.error('Test 2 failed: did not throw');
  } catch (e) {
    if (e.message.includes('matches MONGODB_URI')) {
      console.log('Test 2 passed');
    } else {
      console.error('Test 2 failed with wrong error', e);
    }
  }

  // Test 3: Remote cluster
  process.env.MONGODB_URI = 'mongodb+srv://prod';
  process.env.TEST_MONGODB_URI = 'mongodb+srv://staging';
  
  try {
    await dbConnect();
    console.error('Test 3 failed: did not throw');
  } catch (e) {
    if (e.message.includes('remote cluster')) {
      console.log('Test 3 passed');
    } else {
      console.error('Test 3 failed with wrong error', e);
    }
  }

  process.env = processEnvBackup;
  console.log('Done');
}

testGuard().catch(console.error);

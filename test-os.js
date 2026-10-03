const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

// Since onesignal-server uses fetch and env vars, we can just write a quick fetch script
async function test() {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const restKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !restKey) {
    console.error("Missing ONE SIGNAL env vars");
    return;
  }

  // We need to know the external_id to target. 
  // Let's target all active users or a specific one? We don't have a specific userId.
  // Instead, let's fetch apps to see if the rest key is working.
  console.log("App ID:", appId);
}

test();

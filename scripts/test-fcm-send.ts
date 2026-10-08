import 'dotenv/config';
import { sendPushNotification } from '../src/lib/notifications/firebase-server';

async function testPush() {
  console.log('--- FCM REAL PUSH SEND TEST ---');
  const targetUserId = '6ac5cdf18eb19e0adb5cc77d'; // User Noor with registered Win32 Chrome token
  console.log(`Sending to target user: ${targetUserId}...`);

  const response = await sendPushNotification({
    userId: targetUserId,
    title: 'Manageo Verification Push 🔔',
    body: 'FCM push delivery verified with WebPush High Urgency header and collapseId tag.',
    url: '/dashboard',
    type: 'SYSTEM',
    collapseId: 'test_verify_' + Date.now(),
  });

  console.log('Firebase Multicast Response:', response);
  process.exit(0);
}

testPush().catch((err) => {
  console.error('Fatal push test error:', err);
  process.exit(1);
});

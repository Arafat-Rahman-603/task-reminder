import 'dotenv/config';

console.log('=== FIREBASE CLIENT CONFIG VALIDATION ===\n');

const vars = [
  ['NEXT_PUBLIC_FIREBASE_API_KEY',            process.env.NEXT_PUBLIC_FIREBASE_API_KEY],
  ['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN],
  ['NEXT_PUBLIC_FIREBASE_PROJECT_ID',         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID],
  ['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET],
  ['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID],
  ['NEXT_PUBLIC_FIREBASE_APP_ID',             process.env.NEXT_PUBLIC_FIREBASE_APP_ID],
  ['NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',     process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID],
  ['NEXT_PUBLIC_FIREBASE_VAPID_KEY',          process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY],
];

let ok = true;
for (const [name, value] of vars) {
  if (value && String(value).trim().length > 0) {
    const masked = name.includes('API_KEY') || name.includes('VAPID')
      ? String(value).slice(0, 8) + '…' + String(value).slice(-6)
      : value;
    console.log(`  ✅ ${name.padEnd(50)} = ${masked}`);
  } else {
    console.log(`  ❌ ${name.padEnd(50)} = (MISSING/EMPTY)`);
    ok = false;
  }
}

console.log('');
console.log('=== MESSAGING SENDER ID SANITY CHECK ===');
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '';
const mSender = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '';
const fromAppId = appId.split(':')[1];
if (fromAppId && mSender && fromAppId === mSender) {
  console.log(`  ✅ messagingSenderId (${mSender}) matches project-number inside App ID (1:${fromAppId}:web:...)`);
} else {
  console.log(`  ⚠️  messagingSenderId = ${mSender}, App-ID project number = ${fromAppId || '(n/a)'}`);
  ok = false;
}

console.log('');
console.log(ok ? '✅ ALL CLIENT FIREBASE ENV VARS ARE PRESENT AND CONSISTENT.' : '❌ One or more client vars missing or inconsistent.');
process.exit(ok ? 0 : 1);

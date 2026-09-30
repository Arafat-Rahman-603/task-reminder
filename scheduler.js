/**
 * Manageo Production Scheduler (VPS / PM2)
 * 
 * Run this with pm2 in production:
 * pm2 start scheduler.js --name "manageo-scheduler"
 * 
 * This script runs every minute and hits the internal cron endpoint.
 * Ensures exactly one scheduler is running for the application.
 */
import http from 'http';
import https from 'https';

// Configure this to your production URL if running externally,
// or use localhost if running on the same VPS as the Next.js app.
const CRON_URL = process.env.CRON_URL || 'http://localhost:3000/api/notifications/cron';
const CRON_SECRET = process.env.CRON_SECRET || '';

console.log(`[Scheduler] Starting Manageo Cron Worker`);
console.log(`[Scheduler] Target URL: ${CRON_URL}`);

setInterval(() => {
  console.log(`[Scheduler] Triggering cron at ${new Date().toISOString()}`);
  
  const client = CRON_URL.startsWith('https') ? https : http;
  
  const reqUrl = new URL(CRON_URL);
  if (CRON_SECRET) {
    reqUrl.searchParams.set('key', CRON_SECRET);
  }

  const req = client.get(reqUrl.toString(), (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`[Scheduler] Response [${res.statusCode}]: ${data}`);
    });
  });

  req.on('error', (err) => {
    console.error(`[Scheduler] Failed to trigger cron: ${err.message}`);
  });
}, 60 * 1000);

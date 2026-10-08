/**
 * Manageo Production Scheduler (VPS / PM2)
 *
 * Runs every minute and triggers the internal cron endpoint.
 * Designed to stay alive continuously under PM2.
 */

import 'dotenv/config';
import http from 'http';
import https from 'https';

const CRON_URL =
  process.env.CRON_URL ||
  'https://manageo.axiomixs.com/api/notifications/cron';

const CRON_SECRET = process.env.CRON_SECRET || '';

const INTERVAL_MS = 60 * 1000;

console.log('[Scheduler] Starting Manageo Cron Worker');
console.log(`[Scheduler] Target URL: ${CRON_URL}`);

function triggerCron() {
  console.log(
    `[Scheduler] Triggering cron at ${new Date().toISOString()}`
  );

  try {
    const client = CRON_URL.startsWith('https') ? https : http;

    const reqUrl = new URL(CRON_URL);

    if (CRON_SECRET) {
      reqUrl.searchParams.set('key', CRON_SECRET);
    }

    const req = client.get(reqUrl.toString(), (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(
          `[Scheduler] Response [${res.statusCode}]: ${data}`
        );
      });

      res.on('error', (err) => {
        console.error(
          `[Scheduler] Response error: ${err.message}`
        );
      });
    });

    req.setTimeout(30_000, () => {
      console.error('[Scheduler] Request timed out after 30 seconds');
      req.destroy();
    });

    req.on('error', (err) => {
      console.error(
        `[Scheduler] Failed to trigger cron: ${err.message}`
      );
    });
  } catch (err) {
    console.error(
      `[Scheduler] Unexpected scheduler error: ${err instanceof Error ? err.message : String(err)
      }`
    );
  }
}

// Trigger once after startup instead of waiting for the first minute.
triggerCron();

// Run exactly once every minute.
setInterval(triggerCron, INTERVAL_MS);

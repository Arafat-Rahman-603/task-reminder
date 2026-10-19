const http = require('http');
const https = require('https');
const { performance } = require('perf_hooks');

const BASE_URL = process.env.TARGET_URL || 'http://localhost:3000';
const parsedUrl = new URL(BASE_URL);

const httpAgent = new (parsedUrl.protocol === 'https:' ? https.Agent : http.Agent)({
  keepAlive: true,
  maxSockets: 1000,
  maxFreeSockets: 256,
  timeout: 30000,
});

const PAGE_ENDPOINTS = [
  '/',
  '/features',
  '/pricing',
  '/faq',
  '/login',
];

const API_ENDPOINTS = [
  '/api/auth/csrf',
  '/api/auth/providers',
];

const ALL_ENDPOINTS = [...PAGE_ENDPOINTS, ...API_ENDPOINTS];

function sendRequest(path) {
  return new Promise((resolve) => {
    const start = performance.now();
    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;

    const req = client.request(
      {
        protocol: parsedUrl.protocol,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path,
        method: 'GET',
        agent: httpAgent,
        headers: {
          'User-Agent': 'Manageo-LoadTest/1.0',
          'Accept': '*/*',
          'Connection': 'keep-alive',
        },
        timeout: 30000,
      },
      (res) => {
        let bodyLength = 0;
        res.on('data', (chunk) => {
          bodyLength += chunk.length;
        });
        res.on('end', () => {
          const duration = performance.now() - start;
          resolve({
            path,
            isApi: path.startsWith('/api'),
            success: res.statusCode >= 200 && res.statusCode < 400,
            status: res.statusCode,
            origin: 'SERVER_HTTP',
            duration,
            bodyLength,
          });
        });
      }
    );

    req.on('error', (err) => {
      const duration = performance.now() - start;
      resolve({
        path,
        isApi: path.startsWith('/api'),
        success: false,
        status: 0,
        origin: 'CLIENT_ERROR',
        error: err.code || err.message,
        duration,
        bodyLength: 0,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      const duration = performance.now() - start;
      resolve({
        path,
        isApi: path.startsWith('/api'),
        success: false,
        status: 408,
        origin: 'CLIENT_TIMEOUT',
        error: 'CLIENT_TIMEOUT',
        duration,
        bodyLength: 0,
      });
    });

    req.end();
  });
}

function calculatePercentile(values, percentile) {
  if (!values || values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

async function runTier(name, concurrency, totalRequests, endpoints = ALL_ENDPOINTS) {
  process.stdout.write(`\n🚀 [${name}] Concurrency: ${concurrency} | Requests: ${totalRequests} ... `);
  const startTime = performance.now();
  const allDurations = [];
  const apiDurations = [];
  const pageDurations = [];
  const statusCounts = {};
  const originCounts = {};
  let successCount = 0;
  let failureCount = 0;
  let inFlight = 0;
  let sentRequests = 0;

  return new Promise((resolve) => {
    function launchWorker() {
      while (inFlight < concurrency && sentRequests < totalRequests) {
        const endpoint = endpoints[sentRequests % endpoints.length];
        sentRequests++;
        inFlight++;

        sendRequest(endpoint).then((res) => {
          inFlight--;
          allDurations.push(res.duration);
          if (res.isApi) {
            apiDurations.push(res.duration);
          } else {
            pageDurations.push(res.duration);
          }

          statusCounts[res.status] = (statusCounts[res.status] || 0) + 1;
          originCounts[res.origin] = (originCounts[res.origin] || 0) + 1;

          if (res.success) {
            successCount++;
          } else {
            failureCount++;
          }

          if (sentRequests < totalRequests) {
            launchWorker();
          } else if (inFlight === 0) {
            const totalDurationSec = (performance.now() - startTime) / 1000;
            const rps = totalRequests / totalDurationSec;
            const meanLatency = allDurations.reduce((a, b) => a + b, 0) / allDurations.length;
            const minLatency = Math.min(...allDurations);
            const maxLatency = Math.max(...allDurations);
            const p50 = calculatePercentile(allDurations, 50);
            const p90 = calculatePercentile(allDurations, 90);
            const p95 = calculatePercentile(allDurations, 95);
            const p99 = calculatePercentile(allDurations, 99);

            const apiMean = apiDurations.length > 0 ? (apiDurations.reduce((a, b) => a + b, 0) / apiDurations.length).toFixed(1) : 'N/A';
            const apiP50 = apiDurations.length > 0 ? calculatePercentile(apiDurations, 50).toFixed(1) : 'N/A';
            const apiP95 = apiDurations.length > 0 ? calculatePercentile(apiDurations, 95).toFixed(1) : 'N/A';

            const pageMean = pageDurations.length > 0 ? (pageDurations.reduce((a, b) => a + b, 0) / pageDurations.length).toFixed(1) : 'N/A';
            const pageP50 = pageDurations.length > 0 ? calculatePercentile(pageDurations, 50).toFixed(1) : 'N/A';
            const pageP95 = pageDurations.length > 0 ? calculatePercentile(pageDurations, 95).toFixed(1) : 'N/A';

            const result = {
              name,
              concurrency,
              totalRequests,
              successCount,
              failureCount,
              durationSec: totalDurationSec.toFixed(2),
              rps: rps.toFixed(1),
              min: minLatency.toFixed(1),
              mean: meanLatency.toFixed(1),
              p50: p50.toFixed(1),
              p90: p90.toFixed(1),
              p95: p95.toFixed(1),
              p99: p99.toFixed(1),
              max: maxLatency.toFixed(1),
              apiMean,
              apiP50,
              apiP95,
              pageMean,
              pageP50,
              pageP95,
              statusCodes: statusCounts,
              origins: originCounts,
              rawDurations: allDurations,
              rawApiDurations: apiDurations,
              rawPageDurations: pageDurations,
            };

            console.log(`COMPLETED in ${result.durationSec}s | RPS: ${result.rps} | p95: ${result.p95}ms | Errors: ${failureCount}`);
            resolve(result);
          }
        });
      }
    }

    launchWorker();
  });
}

async function warmup() {
  console.log(`🔥 Pre-warming endpoints at ${BASE_URL} ...`);
  for (const ep of ALL_ENDPOINTS) {
    await sendRequest(ep);
  }
  console.log(`✅ Pre-warm complete for all ${ALL_ENDPOINTS.length} endpoints.`);
}

async function main() {
  console.log('='.repeat(80));
  console.log('              MANAGEO APPLICATION MAXIMUM LOAD & STRESS BENCHMARK        ');
  console.log('='.repeat(80));
  console.log(`Target: ${BASE_URL}`);
  console.log(`Endpoints Under Test:`);
  console.log(`  Pages: ${PAGE_ENDPOINTS.join(', ')}`);
  console.log(`  APIs:  ${API_ENDPOINTS.join(', ')}`);
  console.log(`Node Environment: Node ${process.version} on ${process.platform}`);
  console.log('='.repeat(80));

  await warmup();

  const memoryBefore = process.memoryUsage();

  const tiers = [
    { name: 'Baseline 10', concurrency: 10, totalRequests: 50, endpoints: ALL_ENDPOINTS },
    { name: 'Moderate 25', concurrency: 25, totalRequests: 100, endpoints: ALL_ENDPOINTS },
    { name: 'High Load 50', concurrency: 50, totalRequests: 150, endpoints: ALL_ENDPOINTS },
    { name: 'Peak 100', concurrency: 100, totalRequests: 200, endpoints: ALL_ENDPOINTS },
    { name: 'Extreme 200', concurrency: 200, totalRequests: 250, endpoints: ALL_ENDPOINTS },
    { name: 'Max Limit 250', concurrency: 250, totalRequests: 300, endpoints: ALL_ENDPOINTS },
    // Pure API Throughput at Max Load
    { name: 'API Max Load 50', concurrency: 50, totalRequests: 200, endpoints: API_ENDPOINTS },
    { name: 'API Max Load 100', concurrency: 100, totalRequests: 300, endpoints: API_ENDPOINTS },
  ];

  const results = [];

  for (const tier of tiers) {
    const res = await runTier(tier.name, tier.concurrency, tier.totalRequests, tier.endpoints);
    results.push(res);
    await new Promise((r) => setTimeout(r, 200));
  }

  const memoryAfter = process.memoryUsage();

  console.log('\n' + '='.repeat(105));
  console.log('                                  FINAL LOAD TEST MATRIX                           ');
  console.log('='.repeat(105));
  console.log(
    'Tier Name'.padEnd(18) +
    'Concurr'.padEnd(9) +
    'Reqs'.padEnd(8) +
    'Success'.padEnd(10) +
    'RPS'.padEnd(8) +
    'p50(ms)'.padEnd(9) +
    'p90(ms)'.padEnd(9) +
    'p95(ms)'.padEnd(9) +
    'p99(ms)'.padEnd(9) +
    'Max(ms)'.padEnd(10) +
    'API p95'.padEnd(10) +
    'Page p95'
  );
  console.log('-'.repeat(105));

  for (const r of results) {
    console.log(
      r.name.padEnd(18) +
      String(r.concurrency).padEnd(9) +
      String(r.totalRequests).padEnd(8) +
      `${r.successCount}/${r.totalRequests}`.padEnd(10) +
      String(r.rps).padEnd(8) +
      String(r.p50).padEnd(9) +
      String(r.p90).padEnd(9) +
      String(r.p95).padEnd(9) +
      String(r.p99).padEnd(9) +
      String(r.max).padEnd(10) +
      String(r.apiP95).padEnd(10) +
      String(r.pageP95)
    );
  }
  console.log('='.repeat(105));

  const totalAllRequests = results.reduce((acc, r) => acc + r.totalRequests, 0);
  const totalAllSuccess = results.reduce((acc, r) => acc + r.successCount, 0);
  const totalAllFail = results.reduce((acc, r) => acc + r.failureCount, 0);
  const peakRps = Math.max(...results.map((r) => parseFloat(r.rps)));
  
  // Statistical Analysis:
  // 1. Flawed arithmetic average of tier p95s (for baseline comparison)
  const arithmeticAvgP95 = (results.reduce((acc, r) => acc + parseFloat(r.p95), 0) / results.length).toFixed(1);
  
  // 2. True global pooled percentiles
  const pooledAllDurations = results.flatMap((r) => r.rawDurations);
  const pooledApiDurations = results.flatMap((r) => r.rawApiDurations);
  const pooledPageDurations = results.flatMap((r) => r.rawPageDurations);

  const globalP50 = calculatePercentile(pooledAllDurations, 50).toFixed(1);
  const globalP90 = calculatePercentile(pooledAllDurations, 90).toFixed(1);
  const globalP95 = calculatePercentile(pooledAllDurations, 95).toFixed(1);
  const globalP99 = calculatePercentile(pooledAllDurations, 99).toFixed(1);
  const globalMean = (pooledAllDurations.reduce((a, b) => a + b, 0) / pooledAllDurations.length).toFixed(1);

  const globalApiP50 = pooledApiDurations.length > 0 ? calculatePercentile(pooledApiDurations, 50).toFixed(1) : 'N/A';
  const globalApiP95 = pooledApiDurations.length > 0 ? calculatePercentile(pooledApiDurations, 95).toFixed(1) : 'N/A';

  const globalPageP50 = pooledPageDurations.length > 0 ? calculatePercentile(pooledPageDurations, 50).toFixed(1) : 'N/A';
  const globalPageP95 = pooledPageDurations.length > 0 ? calculatePercentile(pooledPageDurations, 95).toFixed(1) : 'N/A';

  // Aggregate status codes and origins
  const aggregatedStatusCodes = {};
  const aggregatedOrigins = {};
  for (const r of results) {
    for (const [code, count] of Object.entries(r.statusCodes)) {
      aggregatedStatusCodes[code] = (aggregatedStatusCodes[code] || 0) + count;
    }
    for (const [origin, count] of Object.entries(r.origins)) {
      aggregatedOrigins[origin] = (aggregatedOrigins[origin] || 0) + count;
    }
  }

  console.log(`\n📊 OVERALL WORKLOAD SUMMARY:`);
  console.log(`• Total Requests Processed:     ${totalAllRequests.toLocaleString()}`);
  console.log(`• Total Successful:             ${totalAllSuccess.toLocaleString()} (${((totalAllSuccess / totalAllRequests) * 100).toFixed(2)}%)`);
  console.log(`• Total Failures:               ${totalAllFail.toLocaleString()} (${((totalAllFail / totalAllRequests) * 100).toFixed(2)}%)`);
  console.log(`• Peak Tier Throughput:         ${peakRps} req/sec`);
  console.log(`• Global Workload Mean Latency: ${globalMean} ms`);
  console.log(`• Global Workload p50:          ${globalP50} ms`);
  console.log(`• Global Workload p90:          ${globalP90} ms`);
  console.log(`• Global Workload p95 (True):   ${globalP95} ms`);
  console.log(`• Global Workload p99:          ${globalP99} ms`);
  console.log(`• Legacy Arithmetic avgP95:     ${arithmeticAvgP95} ms (statistically flawed metric)`);
  console.log(`• Breakdown by Category:`);
  console.log(`    - API Endpoints:  p50 = ${globalApiP50} ms | p95 = ${globalApiP95} ms`);
  console.log(`    - Page Endpoints: p50 = ${globalPageP50} ms | p95 = ${globalPageP95} ms`);
  console.log(`• Status Codes Breakdown:       ${JSON.stringify(aggregatedStatusCodes)}`);
  console.log(`• Failure Origins Breakdown:    ${JSON.stringify(aggregatedOrigins)}`);
  console.log(`• Client Process Memory Delta:  ${((memoryAfter.heapUsed - memoryBefore.heapUsed) / (1024 * 1024)).toFixed(2)} MB`);

  // Strip huge rawDuration arrays from final saved results
  const sanitizedResults = results.map(({ rawDurations, rawApiDurations, rawPageDurations, ...rest }) => rest);

  const fs = require('fs');
  fs.writeFileSync('load-test-report.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    targetUrl: BASE_URL,
    totalRequests: totalAllRequests,
    totalSuccess: totalAllSuccess,
    totalFailures: totalAllFail,
    successRate: `${((totalAllSuccess / totalAllRequests) * 100).toFixed(2)}%`,
    peakRps,
    globalPercentiles: {
      mean: globalMean,
      p50: globalP50,
      p90: globalP90,
      p95: globalP95,
      p99: globalP99,
    },
    legacyArithmeticAvgP95: arithmeticAvgP95,
    categoryBreakdown: {
      api: { p50: globalApiP50, p95: globalApiP95 },
      pages: { p50: globalPageP50, p95: globalPageP95 },
    },
    statusCodes: aggregatedStatusCodes,
    origins: aggregatedOrigins,
    results: sanitizedResults,
  }, null, 2));

  console.log(`\n📁 Full JSON results saved to: load-test-report.json`);
}

main().catch((err) => {
  console.error('Fatal load test error:', err);
  process.exit(1);
});

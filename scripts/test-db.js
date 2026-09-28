const dns = require('dns');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// 1. Parse .env safely (do not expose credentials)
const envPath = path.join(__dirname, '..', '.env');
let MONGODB_URI = '';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/^MONGODB_URI=(.*)$/m);
  if (match) MONGODB_URI = match[1].trim();
}

console.log('[env] MONGODB_URI configured:', MONGODB_URI ? 'Yes' : 'No');

if (!MONGODB_URI) {
  console.log('[diagnostics] Exiting, no URI found.');
  process.exit(1);
}

// Check URI structure
let isSrv = MONGODB_URI.startsWith('mongodb+srv://');
console.log(`[env] URI structure: ${isSrv ? 'mongodb+srv://' : 'mongodb://'}`);

let hostname = '';
try {
  // Regex to extract hostname from mongodb(+srv)://username:password@hostname/db
  const hostMatch = MONGODB_URI.match(/@([^/?]+)/);
  if (hostMatch) {
    hostname = hostMatch[1].split(':')[0]; // get the domain part without port
    console.log(`[env] Hostname parsed: ${hostname}`);
  }
} catch (e) {}

async function runDiagnostics() {
  // 3. DNS Resolution Test
  if (isSrv && hostname) {
    const srvRecord = `_mongodb._tcp.${hostname}`;
    console.log(`[dns] Attempting SRV lookup for: ${srvRecord}`);
    
    // Test local resolver
    try {
      await dns.promises.resolveSrv(srvRecord);
      console.log('[dns] SRV resolution successful (local DNS).');
    } catch (err) {
      console.log(`[dns] SRV resolution failed (local DNS): ${err.code}`);
      
      // Test alternative resolver (8.8.8.8)
      try {
        const { Resolver } = require('dns').promises;
        const resolver = new Resolver();
        resolver.setServers(['8.8.8.8']);
        await resolver.resolveSrv(srvRecord);
        console.log('[dns] SRV resolution successful using 8.8.8.8 (Google DNS).');
        console.log('[dns] YOUR LOCAL NETWORK OR DNS RESOLVER IS REFUSING SRV QUERIES.');
      } catch (err2) {
        console.log(`[dns] SRV resolution failed (8.8.8.8): ${err2.code}`);
      }
    }
  }

  // 4. Connection Test
  console.log('[mongodb] Attempting connection...');
  try {
    // Attempt with strict timeout to not hang
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('[mongodb] connection successful');
    await mongoose.disconnect();
  } catch (err) {
    console.log('[mongodb] connection failed');
    console.log('[mongodb] Error code:', err.code || err.name);
    console.log('[mongodb] Error message:', err.message);
  }
}

runDiagnostics().catch(e => console.error(e));

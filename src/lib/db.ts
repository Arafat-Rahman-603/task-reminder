import mongoose from 'mongoose';
import { env } from '@/lib/env';

let cached = (global as any).mongoose;

if (!cached) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  // Evaluate the URI inside dbConnect() to allow tests to configure process.env in beforeAll hooks
  let rawUri = env.MONGODB_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/test';

  if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined) {
    if (!process.env.TEST_MONGODB_URI) {
      throw new Error('FATAL: TEST_MONGODB_URI is not set. Refusing to connect in test environment to prevent production data corruption.');
    }
    if (process.env.TEST_MONGODB_URI === process.env.MONGODB_URI) {
      throw new Error('FATAL: TEST_MONGODB_URI matches MONGODB_URI. Tests must use a strictly isolated database.');
    }
    if (!process.env.TEST_MONGODB_URI.includes('127.0.0.1') && !process.env.TEST_MONGODB_URI.includes('localhost') && !process.env.TEST_MONGODB_URI.includes('memory') && !process.env.TEST_MONGODB_URI.includes('127.0.0.1')) {
      throw new Error('FATAL: TEST_MONGODB_URI appears to point to a remote cluster. Tests must use a local or in-memory isolated database.');
    }
    rawUri = process.env.TEST_MONGODB_URI;
  }

  const MONGODB_URI = rawUri.replace('localhost', '127.0.0.1');

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      driverInfo: { name: 'nodejs', version: '20' },
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err: unknown) {
    cached.promise = null;
    const e = err as Error;
    
    // Categorize error safely without exposing secrets
    let errorCategory = "UNKNOWN";
    if (e.message?.includes("ECONNREFUSED") && e.message?.includes("querySrv")) {
      errorCategory = "DNS_SRV_REFUSED";
    } else if (e.message?.includes("Authentication failed")) {
      errorCategory = "AUTHENTICATION_FAILED";
    } else if (e.message?.includes("bad auth")) {
      errorCategory = "AUTHENTICATION_FAILED";
    } else if (e.message?.includes("timeout")) {
      errorCategory = "TIMEOUT";
    } else if (e.message?.includes("IP")) {
      errorCategory = "NETWORK_ACCESS_REJECTED";
    }

    console.error(`[DATABASE_ERROR] Connection failed. Category: ${errorCategory}`);
    
    // Do not throw the original error which might contain the URI string
    throw new Error(`Database connection failed: ${errorCategory}`);
  }

  return cached.conn;
}

export default dbConnect;

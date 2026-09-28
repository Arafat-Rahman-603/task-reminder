import mongoose from 'mongoose';
import { env } from '@/lib/env';

const MONGODB_URI = env.MONGODB_URI;

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
let cached = (global as any).mongoose;

if (!cached) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
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

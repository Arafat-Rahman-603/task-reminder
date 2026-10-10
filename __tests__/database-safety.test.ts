import mongoose from 'mongoose';

describe('Database Safety Guard Tests', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let dbConnect: any;

  beforeEach(() => {
    originalEnv = { ...process.env };
    // Clear global mongoose cache to force a fresh dbConnect evaluation
    (global as any).mongoose = { conn: null, promise: null };
  });

  afterEach(() => {
    // Restore process.env keys correctly
    Object.keys(process.env).forEach(key => delete process.env[key]);
    Object.assign(process.env, originalEnv);
    (global as any).mongoose = { conn: null, promise: null };
  });

  it('rejects connection if TEST_MONGODB_URI is missing in test environment', async () => {
    (process.env as any).NODE_ENV = 'test';
    delete process.env.TEST_MONGODB_URI;
    
    dbConnect = require('@/lib/db').default;
    
    await expect(dbConnect()).rejects.toThrow('FATAL: TEST_MONGODB_URI is not set');
  });

  it('rejects connection if TEST_MONGODB_URI matches MONGODB_URI (preventing accidental production override)', async () => {
    (process.env as any).NODE_ENV = 'test';
    process.env.MONGODB_URI = 'mongodb+srv://admin:pass@production.cluster.mongodb.net/prod';
    process.env.TEST_MONGODB_URI = 'mongodb+srv://admin:pass@production.cluster.mongodb.net/prod';
    
    dbConnect = require('@/lib/db').default;
    
    await expect(dbConnect()).rejects.toThrow('FATAL: TEST_MONGODB_URI matches MONGODB_URI');
  });

  it('rejects remote cluster URIs for testing', async () => {
    (process.env as any).NODE_ENV = 'test';
    process.env.MONGODB_URI = 'mongodb+srv://admin:pass@production.cluster.mongodb.net/prod';
    process.env.TEST_MONGODB_URI = 'mongodb+srv://admin:pass@staging.cluster.mongodb.net/staging';
    
    dbConnect = require('@/lib/db').default;
    
    await expect(dbConnect()).rejects.toThrow('FATAL: TEST_MONGODB_URI appears to point to a remote cluster');
  });

  it('allows connection if TEST_MONGODB_URI is a safe local/memory URI', async () => {
    // This uses the MongoMemoryServer URI injected by jest.setup.ts globally
    expect(process.env.TEST_MONGODB_URI).toContain('127.0.0.1');
    
    dbConnect = require('@/lib/db').default;
    const conn = await dbConnect();
    
    expect(conn).toBeTruthy();
    expect(mongoose.connection.readyState).toBeGreaterThan(0);
  });
});

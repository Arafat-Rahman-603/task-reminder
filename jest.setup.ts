import os from 'os';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// MongoDB Node.js driver 7.2+ uses dynamic import('os') in resolveRuntimeAdapters,
// which throws inside Jest's CommonJS VM sandbox. Supplying runtimeAdapters.os ensures
// the client metadata document contains the required 'driver' sub-document during handshake.
const originalConnect = mongoose.connect.bind(mongoose);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
mongoose.connect = function (uri: string, options?: any) {
  return originalConnect(uri, {
    runtimeAdapters: { os },
    ...options,
  });
};

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.TEST_MONGODB_URI = mongoServer.getUri();
}, 60000);

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

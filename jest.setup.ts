import os from 'os';
import mongoose from 'mongoose';

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

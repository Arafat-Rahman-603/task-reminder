import { GET } from '@/app/api/assets/[...publicId]/route';
import { NextRequest } from 'next/server';
import mongoose from 'mongoose';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}));

jest.mock('../src/actions/cloudinary.actions', () => ({
  getSignedUrl: jest.fn().mockResolvedValue({ success: true, url: 'https://cloudinary.com/signed/url' })
}));

jest.mock('../src/lib/workspace', () => ({
  verifyWorkspaceAccess: jest.fn()
}));

jest.mock('../src/models/User', () => ({
  __esModule: true,
  default: { exists: jest.fn() }
}));

jest.mock('../src/models/VaultItem', () => ({
  __esModule: true,
  default: { exists: jest.fn() }
}));

jest.mock('../src/models/Transaction', () => ({
  __esModule: true,
  default: { exists: jest.fn() }
}));

jest.mock('../src/models/Invoice', () => ({
  __esModule: true,
  default: { exists: jest.fn() }
}));

jest.mock('../src/models/Task', () => ({
  __esModule: true,
  default: { findOne: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn() }) }) }
}));

jest.mock('../src/models/Note', () => ({
  __esModule: true,
  default: { findOne: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn() }) }) }
}));

jest.mock('../src/models/Idea', () => ({
  __esModule: true,
  default: { findOne: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn() }) }) }
}));

jest.mock('../src/models/WorkspaceMembership', () => ({
  __esModule: true,
  default: { find: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn() }) }) }
}));

jest.mock('../src/models/custom/CustomRecord', () => ({
  __esModule: true,
  default: { find: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn() }) }) }
}));

jest.mock('../src/lib/db', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(true)
}));

describe('Asset Proxy API', () => {
  const { getServerSession } = require('next-auth');
  const User = require('../src/models/User').default;
  const VaultItem = require('../src/models/VaultItem').default;
  const Transaction = require('../src/models/Transaction').default;
  const Invoice = require('../src/models/Invoice').default;
  const Task = require('../src/models/Task').default;
  const WorkspaceMembership = require('../src/models/WorkspaceMembership').default;
  const CustomRecord = require('../src/models/custom/CustomRecord').default;
  const { verifyWorkspaceAccess } = require('../src/lib/workspace');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Denies access to unauthenticated users', async () => {
    getServerSession.mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/assets/someId');
    const res = await GET(req, { params: Promise.resolve({ publicId: ['someId'] }) });
    expect(res.status).toBe(401);
  });

  it('Allows access if publicId is an avatar', async () => {
    getServerSession.mockResolvedValue({ user: { id: new mongoose.Types.ObjectId().toString() } });
    User.exists.mockResolvedValue(true);
    
    const req = new NextRequest('http://localhost/api/assets/avatar123');
    const res = await GET(req, { params: Promise.resolve({ publicId: ['avatar123'] }) });
    expect(res.status).toBe(307); // redirect
  });

  it('Denies access if asset not found anywhere', async () => {
    getServerSession.mockResolvedValue({ user: { id: new mongoose.Types.ObjectId().toString() } });
    User.exists.mockResolvedValue(false);
    VaultItem.exists.mockResolvedValue(false);
    Transaction.exists.mockResolvedValue(false);
    Invoice.exists.mockResolvedValue(false);
    Task.findOne().select().lean.mockResolvedValue(null);
    WorkspaceMembership.find().select().lean.mockResolvedValue([]);
    CustomRecord.find().select().lean.mockResolvedValue([]);
    
    const req = new NextRequest('http://localhost/api/assets/unknownId');
    const res = await GET(req, { params: Promise.resolve({ publicId: ['unknownId'] }) });
    expect(res.status).toBe(403);
  });

  it('Allows access for personal VaultItem', async () => {
    getServerSession.mockResolvedValue({ user: { id: new mongoose.Types.ObjectId().toString() } });
    User.exists.mockResolvedValue(false);
    VaultItem.exists.mockResolvedValue(true);
    
    const req = new NextRequest('http://localhost/api/assets/vaultId');
    const res = await GET(req, { params: Promise.resolve({ publicId: ['vaultId'] }) });
    expect(res.status).toBe(307);
  });
  
  it('Allows access for Task if workspace verification passes', async () => {
    getServerSession.mockResolvedValue({ user: { id: new mongoose.Types.ObjectId().toString() } });
    User.exists.mockResolvedValue(false);
    VaultItem.exists.mockResolvedValue(false);
    Transaction.exists.mockResolvedValue(false);
    Invoice.exists.mockResolvedValue(false);
    
    const wsId = new mongoose.Types.ObjectId();
    Task.findOne().select().lean.mockResolvedValue({ workspaceId: wsId });
    verifyWorkspaceAccess.mockResolvedValue(true);
    
    const req = new NextRequest('http://localhost/api/assets/taskId');
    const res = await GET(req, { params: Promise.resolve({ publicId: ['taskId'] }) });
    expect(res.status).toBe(307);
  });
  
  it('Denies access for Task if workspace verification fails', async () => {
    getServerSession.mockResolvedValue({ user: { id: new mongoose.Types.ObjectId().toString() } });
    User.exists.mockResolvedValue(false);
    VaultItem.exists.mockResolvedValue(false);
    Transaction.exists.mockResolvedValue(false);
    Invoice.exists.mockResolvedValue(false);
    
    const wsId = new mongoose.Types.ObjectId();
    Task.findOne().select().lean.mockResolvedValue({ workspaceId: wsId });
    verifyWorkspaceAccess.mockRejectedValue(new Error('Not a member'));
    WorkspaceMembership.find().select().lean.mockResolvedValue([]);
    CustomRecord.find().select().lean.mockResolvedValue([]);
    
    const req = new NextRequest('http://localhost/api/assets/taskId');
    const res = await GET(req, { params: Promise.resolve({ publicId: ['taskId'] }) });
    expect(res.status).toBe(403);
  });
});

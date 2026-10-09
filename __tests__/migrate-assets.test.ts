import { GET, POST } from '../src/app/api/migrate-assets/route';
import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import Task from '../src/models/Task';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
  default: jest.fn()
}));

jest.mock('../src/models/User', () => ({
  __esModule: true,
  default: {
    findById: jest.fn().mockReturnValue({
      lean: jest.fn()
    }),
    find: jest.fn().mockResolvedValue([])
  }
}));

jest.mock('../src/models/Task', () => ({ __esModule: true, default: { find: jest.fn().mockResolvedValue([]) } }));
jest.mock('../src/models/Note', () => ({ __esModule: true, default: { find: jest.fn().mockResolvedValue([]) } }));
jest.mock('../src/models/Idea', () => ({ __esModule: true, default: { find: jest.fn().mockResolvedValue([]) } }));
jest.mock('../src/models/custom/CustomRecord', () => ({ __esModule: true, default: { find: jest.fn().mockResolvedValue([]) } }));
jest.mock('../src/models/VaultItem', () => ({ __esModule: true, default: { find: jest.fn().mockResolvedValue([]) } }));
jest.mock('../src/models/Transaction', () => ({ __esModule: true, default: { find: jest.fn().mockResolvedValue([]) } }));

jest.mock('../src/lib/db', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(true)
}));

describe('Migrate Assets API', () => {
  const { getServerSession } = require('next-auth');
  const User = require('../src/models/User').default;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Denies access to unauthenticated users', async () => {
    getServerSession.mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/migrate-assets');
    
    const resGet = await GET(req);
    expect(resGet.status).toBe(401);

    const resPost = await POST(req);
    expect(resPost.status).toBe(401);
  });

  it('Denies access to non-admin users', async () => {
    getServerSession.mockResolvedValue({ user: { id: new mongoose.Types.ObjectId().toString() } });
    User.findById().lean.mockResolvedValue({ isPlatformAdmin: false });

    const req = new NextRequest('http://localhost/api/migrate-assets');
    
    const resGet = await GET(req);
    expect(resGet.status).toBe(401);

    const resPost = await POST(req);
    expect(resPost.status).toBe(401);
  });

  it('Allows admin access and defaults GET to dryRun', async () => {
    getServerSession.mockResolvedValue({ user: { id: new mongoose.Types.ObjectId().toString() } });
    User.findById().lean.mockResolvedValue({ isPlatformAdmin: true });

    const req = new NextRequest('http://localhost/api/migrate-assets');
    const resGet = await GET(req);
    
    const data = await resGet.json();
    if (resGet.status !== 200) console.log(data);
    expect(resGet.status).toBe(200);
    expect(data.dryRun).toBe(true);
  });

  it('Allows admin access for POST and executes migration', async () => {
    getServerSession.mockResolvedValue({ user: { id: new mongoose.Types.ObjectId().toString() } });
    User.findById().lean.mockResolvedValue({ isPlatformAdmin: true });

    const req = new NextRequest('http://localhost/api/migrate-assets', { method: 'POST' });
    const resPost = await POST(req);
    
    expect(resPost.status).toBe(200);
    const data = await resPost.json();
    expect(data.dryRun).toBe(false);
  });
});

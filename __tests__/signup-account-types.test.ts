import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User';
import Workspace from '../src/models/Workspace';
import WorkspaceMembership from '../src/models/WorkspaceMembership';
import { POST } from '../src/app/api/auth/register/route';

describe('Signup Account Types Integration Tests', () => {
  beforeAll(async () => {
    const rawUri = process.env.TEST_MONGODB_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/test';
    const uri = rawUri.replace('localhost', '127.0.0.1');
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri);
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await User.deleteMany({ email: { $regex: /@test\.com$/ } });
    await Workspace.deleteMany({ name: { $regex: /Test/ } });
    await WorkspaceMembership.deleteMany({});
  });

  function createRequest(body: any) {
    return new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  it('should provision only a personal workspace for individual account type', async () => {
    const email = 'individual@test.com';
    const req = createRequest({
      name: 'Individual Test',
      email,
      password: 'password123',
      accountType: 'individual',
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const user = await User.findOne({ email });
    expect(user).toBeTruthy();
    expect(user!.accountType).toBe('individual');

    const workspaces = await Workspace.find({ ownerId: user!._id });
    expect(workspaces.length).toBe(1);
    expect(workspaces[0].type).toBe('personal');
    expect(workspaces[0].name).toBe('Personal Workspace');

    const memberships = await WorkspaceMembership.find({ userId: user!._id });
    expect(memberships.length).toBe(1);
    expect(memberships[0].workspaceId.toString()).toBe(workspaces[0]._id.toString());
  });

  it('should provision a team workspace alongside a personal workspace for team_owner account type', async () => {
    const email = 'teamowner@test.com';
    const req = createRequest({
      name: 'TeamOwner Test',
      email,
      password: 'password123',
      accountType: 'team_owner',
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const user = await User.findOne({ email });
    expect(user).toBeTruthy();
    expect(user!.accountType).toBe('team_owner');

    const workspaces = await Workspace.find({ ownerId: user!._id }).sort({ createdAt: 1 });
    expect(workspaces.length).toBe(2);
    
    const personalWs = workspaces.find(w => w.type === 'personal');
    const teamWs = workspaces.find(w => w.type === 'team');
    
    expect(personalWs).toBeTruthy();
    expect(teamWs).toBeTruthy();
    expect(teamWs!.name).toBe("TeamOwner Test's Team");

    const memberships = await WorkspaceMembership.find({ userId: user!._id });
    expect(memberships.length).toBe(2);
  });
});

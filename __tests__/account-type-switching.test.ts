import { updateAccountType } from "../src/actions/user.actions";
import User from "../src/models/User";
import Workspace from "../src/models/Workspace";
import WorkspaceMembership from "../src/models/WorkspaceMembership";
import { getServerSession } from "next-auth";
import dbConnect from "../src/lib/db";

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

describe("Account Type Switching", () => {
  let mockUser: any;

  beforeAll(async () => {
    await dbConnect();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    await User.deleteMany({});
    await Workspace.deleteMany({});
    await WorkspaceMembership.deleteMany({});

    mockUser = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      accountType: "individual"
    });

    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: mockUser._id.toString() }
    });
  });

  it("should upgrade individual to team_owner and create a team workspace", async () => {
    const res = await updateAccountType("team_owner");
    expect(res.success).toBe(true);

    const updatedUser = await User.findById(mockUser._id);
    expect(updatedUser?.accountType).toBe("team_owner");

    const teamWorkspace = await Workspace.findOne({ ownerId: mockUser._id, type: "team" });
    expect(teamWorkspace).toBeDefined();
    expect(teamWorkspace?.name).toBe("Test User's Team");

    const membership = await WorkspaceMembership.findOne({ workspaceId: teamWorkspace?._id, userId: mockUser._id });
    expect(membership).toBeDefined();
    expect(membership?.role).toBe("owner");
  });

  it("should downgrade team_owner to individual without deleting the workspace", async () => {
    mockUser.accountType = "team_owner";
    await mockUser.save();

    const ws = await Workspace.create({
      name: "Test User's Team",
      type: "team",
      ownerId: mockUser._id,
    });
    await WorkspaceMembership.create({
      workspaceId: ws._id,
      userId: mockUser._id,
      role: "owner",
    });

    const res = await updateAccountType("individual");
    expect(res.success).toBe(true);

    const updatedUser = await User.findById(mockUser._id);
    expect(updatedUser?.accountType).toBe("individual");

    // Workspace should STILL exist
    const teamWorkspace = await Workspace.findById(ws._id);
    expect(teamWorkspace).toBeDefined();
    
    // Membership should STILL exist
    const membership = await WorkspaceMembership.findOne({ workspaceId: ws._id, userId: mockUser._id });
    expect(membership).toBeDefined();
  });

  it("should not create duplicate workspaces when upgrading to team_owner if one already exists", async () => {
    const ws = await Workspace.create({
      name: "Existing Team",
      type: "team",
      ownerId: mockUser._id,
    });
    
    const res = await updateAccountType("team_owner");
    expect(res.success).toBe(true);

    const allWorkspaces = await Workspace.find({ ownerId: mockUser._id, type: "team" });
    expect(allWorkspaces.length).toBe(1); // Should still be exactly 1
    expect(allWorkspaces[0].name).toBe("Existing Team"); // It shouldn't overwrite the name
  });
});

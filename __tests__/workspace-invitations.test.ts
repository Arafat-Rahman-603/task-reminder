import 'dotenv/config';
import mongoose from "mongoose";
import Workspace from "@/models/Workspace";
import WorkspaceInvitation from "@/models/WorkspaceInvitation";
import WorkspaceMembership from "@/models/WorkspaceMembership";
import User from "@/models/User";
import dbConnect from "@/lib/db";
import { 
  createInvitation, 
  getInvitationDetails, 
  acceptInvitation,
  resendWorkspaceInvitation
} from "@/actions/workspaceInvitation.actions";

// Mock next-auth getServerSession
const mockGetServerSession = jest.fn();
jest.mock("next-auth", () => ({
  getServerSession: () => mockGetServerSession(),
}));

// Mock next/headers cookies
jest.mock("next/headers", () => ({
  cookies: jest.fn().mockImplementation(async () => ({
    set: jest.fn(),
    get: jest.fn(),
  })),
}));

// Mock Resend email sending
export const mockSendEmail = jest.fn().mockResolvedValue(true);
jest.mock("@/lib/email/resend", () => ({
  sendEmail: (args: any) => mockSendEmail(args),
}));

describe("Workspace Invitations System", () => {
  let ownerUser: any;
  let joiningUser: any;
  let testWorkspace: any;
  let generatedToken: string;

  beforeAll(async () => {
    await dbConnect();

    // Create owner
    ownerUser = await User.create({
      name: "Invite Owner",
      email: `test-invite-owner-${Date.now()}@test.com`,
      passwordHash: "hash123",
      accountType: "team_owner",
    });

    // Create joining user
    joiningUser = await User.create({
      name: "Joining Member",
      email: `test-invite-member-${Date.now()}@test.com`,
      passwordHash: "hash123",
      accountType: "individual",
    });

    // Create workspace
    testWorkspace = await Workspace.create({
      name: "Test Invite Team Workspace",
      type: "team",
      ownerId: ownerUser._id,
      subscription: { plan: "free", status: "active" },
    });

    // Owner membership
    await WorkspaceMembership.create({
      workspaceId: testWorkspace._id,
      userId: ownerUser._id,
      role: "owner",
    });
  });

  afterAll(async () => {
    if (ownerUser?._id) {
      await WorkspaceInvitation.deleteMany({ createdBy: ownerUser._id });
      await WorkspaceMembership.deleteMany({ userId: { $in: [ownerUser._id, joiningUser?._id] } });
      await Workspace.deleteOne({ _id: testWorkspace?._id });
      await User.deleteMany({ _id: { $in: [ownerUser._id, joiningUser?._id] } });
    }
  });

  it("creates a valid invitation for a workspace", async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: { id: ownerUser._id.toString(), email: ownerUser.email, name: ownerUser.name },
    });

    const res = await createInvitation({
      workspaceId: testWorkspace._id.toString(),
      role: "member",
      maxUses: 1,
      expiresInDays: 7,
    });

    expect(res.success).toBe(true);
    expect(res.token).toBeDefined();
    expect(typeof res.token).toBe("string");
    generatedToken = res.token;
  });

  it("retrieves public invitation details cleanly for unauthenticated users", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);

    const details = await getInvitationDetails(generatedToken);

    expect(details.valid).toBe(true);
    expect(details.workspace?.name).toBe("Test Invite Team Workspace");
    expect(details.workspace?.type).toBe("team");
    expect(details.inviter?.name).toBe("Invite Owner");
    expect(details.invitation?.role).toBe("member");
    expect(details.userState?.isLoggedIn).toBe(false);
    expect(details.userState?.isMember).toBe(false);
  });

  it("identifies when the logged-in user is already an owner or member", async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: { id: ownerUser._id.toString(), email: ownerUser.email, name: ownerUser.name },
    });

    const details = await getInvitationDetails(generatedToken);

    expect(details.valid).toBe(true);
    expect(details.userState?.isLoggedIn).toBe(true);
    expect(details.userState?.isMember).toBe(true);
    expect(details.userState?.currentRole).toBe("owner");
  });

  it("allows a new user to accept the invitation and become a member", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: joiningUser._id.toString(), email: joiningUser.email, name: joiningUser.name },
    });

    const acceptRes = await acceptInvitation(generatedToken);

    expect(acceptRes.success).toBe(true);
    expect(acceptRes.workspaceId).toBe(testWorkspace._id.toString());

    // Verify DB membership was created
    const membership = await WorkspaceMembership.findOne({
      workspaceId: testWorkspace._id,
      userId: joiningUser._id,
    });
    expect(membership).toBeDefined();
    expect(membership?.role).toBe("member");
  });

  it("blocks duplicate acceptance once usage limit is reached", async () => {
    const thirdUser = await User.create({
      name: "Third User",
      email: `test-invite-third-${Date.now()}@test.com`,
      passwordHash: "hash123",
      accountType: "individual",
    });

    mockGetServerSession.mockResolvedValue({
      user: { id: thirdUser._id.toString(), email: thirdUser.email, name: thirdUser.name },
    });

    const details = await getInvitationDetails(generatedToken);
    expect(details.valid).toBe(false);
    expect(details.reason).toBe("MAX_USES_REACHED");

    const acceptRes = await acceptInvitation(generatedToken);
    expect(acceptRes.success).toBe(false);
    expect(acceptRes.error).toContain("usage limit");

    await User.deleteOne({ _id: thirdUser._id });
  });

  it("returns NOT_FOUND for non-existent token", async () => {
    const details = await getInvitationDetails("non_existent_token_12345");
    expect(details.valid).toBe(false);
    expect(details.reason).toBe("NOT_FOUND");
  });

  it("sends an invitation email when recipient email is provided", async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: { id: ownerUser._id.toString(), email: ownerUser.email, name: ownerUser.name },
    });
    mockSendEmail.mockClear();

    const inviteeEmail = "newcollaborator@company.com";
    const res = await createInvitation({
      workspaceId: testWorkspace._id.toString(),
      role: "member",
      email: inviteeEmail,
      maxUses: 1,
      expiresInDays: 7,
    });

    expect(res.success).toBe(true);
    expect(res.emailSent).toBe(true);
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: inviteeEmail,
        subject: expect.stringContaining("invited to join Test Invite Team Workspace"),
        htmlContent: expect.stringContaining(res.token),
      })
    );
  });

  it("allows resending an invitation email with a freshly generated token", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: ownerUser._id.toString(), email: ownerUser.email, name: ownerUser.name },
    });
    mockSendEmail.mockClear();

    // Create an invite first
    const inviteeEmail = "resendtest@company.com";
    const createRes = await createInvitation({
      workspaceId: testWorkspace._id.toString(),
      role: "admin",
      email: inviteeEmail,
    });

    expect(createRes.success).toBe(true);
    const invitationId = createRes.invitationId;
    mockSendEmail.mockClear();

    const resendRes = await resendWorkspaceInvitation(invitationId);
    expect(resendRes.success).toBe(true);
    expect(resendRes.emailSent).toBe(true);
    expect(resendRes.token).toBeDefined();
    expect(resendRes.token).not.toBe(createRes.token); // Fresh token generated

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: inviteeEmail,
        subject: expect.stringContaining("Reminder"),
        htmlContent: expect.stringContaining(resendRes.token),
      })
    );
  });
});

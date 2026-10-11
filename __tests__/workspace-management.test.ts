import 'dotenv/config';
import User from "@/models/User";
import Workspace from "@/models/Workspace";
import WorkspaceMembership from "@/models/WorkspaceMembership";
import WorkspaceInvitation from "@/models/WorkspaceInvitation";
import dbConnect from "@/lib/db";
import {
  renameWorkspace,
  archiveWorkspace,
  deleteWorkspace,
} from "@/actions/workspace.actions";

const mockGetServerSession = jest.fn();
jest.mock("next-auth", () => ({
  getServerSession: () => mockGetServerSession(),
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn().mockImplementation(async () => ({
    set: jest.fn(),
    get: jest.fn(),
  })),
}));

describe("Workspace Management Actions (Rename, Archive, Delete)", () => {
  let ownerUser: any;
  let memberUser: any;
  let personalWorkspace: any;
  let teamWorkspace: any;

  beforeAll(async () => {
    await dbConnect();

    ownerUser = await User.create({
      name: "Workspace Owner",
      email: `owner-wm-${Date.now()}@test.com`,
      passwordHash: "hash123",
      accountType: "team_owner",
    });

    memberUser = await User.create({
      name: "Workspace Member",
      email: `member-wm-${Date.now()}@test.com`,
      passwordHash: "hash123",
      accountType: "individual",
    });

    personalWorkspace = await Workspace.create({
      name: "Personal Workspace",
      type: "personal",
      ownerId: ownerUser._id,
    });
    await WorkspaceMembership.create({
      workspaceId: personalWorkspace._id,
      userId: ownerUser._id,
      role: "owner",
    });

    teamWorkspace = await Workspace.create({
      name: "Initial Team Name",
      type: "team",
      ownerId: ownerUser._id,
    });
    await WorkspaceMembership.create({
      workspaceId: teamWorkspace._id,
      userId: ownerUser._id,
      role: "owner",
    });
    await WorkspaceMembership.create({
      workspaceId: teamWorkspace._id,
      userId: memberUser._id,
      role: "member",
    });
  });

  afterAll(async () => {
    if (ownerUser?._id) {
      await WorkspaceInvitation.deleteMany({ createdBy: ownerUser._id });
      await WorkspaceMembership.deleteMany({ userId: { $in: [ownerUser._id, memberUser._id] } });
      await Workspace.deleteMany({ ownerId: ownerUser._id });
      await User.deleteMany({ _id: { $in: [ownerUser._id, memberUser._id] } });
    }
  });

  describe("renameWorkspace", () => {
    it("allows the owner to rename their team workspace", async () => {
      mockGetServerSession.mockResolvedValueOnce({
        user: { id: ownerUser._id.toString(), email: ownerUser.email, name: ownerUser.name },
      });

      const res = await renameWorkspace(teamWorkspace._id.toString(), "Updated Team Name");
      expect(res.success).toBe(true);
      expect(res.name).toBe("Updated Team Name");

      const inDb = await Workspace.findById(teamWorkspace._id);
      expect(inDb?.name).toBe("Updated Team Name");
    });

    it("rejects non-owner attempts to rename the workspace", async () => {
      mockGetServerSession.mockResolvedValueOnce({
        user: { id: memberUser._id.toString(), email: memberUser.email, name: memberUser.name },
      });

      await expect(
        renameWorkspace(teamWorkspace._id.toString(), "Hacked Name")
      ).rejects.toThrow("Only the workspace owner can rename this workspace");
    });

    it("rejects invalid workspace names (too short or empty)", async () => {
      mockGetServerSession.mockResolvedValueOnce({
        user: { id: ownerUser._id.toString(), email: ownerUser.email, name: ownerUser.name },
      });

      await expect(
        renameWorkspace(teamWorkspace._id.toString(), " ")
      ).rejects.toThrow("Workspace name must be between 2 and 60 characters");
    });
  });

  describe("archiveWorkspace", () => {
    it("refuses to archive a personal workspace", async () => {
      mockGetServerSession.mockResolvedValueOnce({
        user: { id: ownerUser._id.toString(), email: ownerUser.email, name: ownerUser.name },
      });

      await expect(
        archiveWorkspace(personalWorkspace._id.toString())
      ).rejects.toThrow("Personal Workspace cannot be archived or deleted");
    });

    it("refuses archiving by a non-owner", async () => {
      mockGetServerSession.mockResolvedValueOnce({
        user: { id: memberUser._id.toString(), email: memberUser.email, name: memberUser.name },
      });

      await expect(
        archiveWorkspace(teamWorkspace._id.toString())
      ).rejects.toThrow("Only the workspace owner can archive this workspace");
    });

    it("allows the owner to archive their team workspace", async () => {
      mockGetServerSession.mockResolvedValueOnce({
        user: { id: ownerUser._id.toString(), email: ownerUser.email, name: ownerUser.name },
      });

      const res = await archiveWorkspace(teamWorkspace._id.toString());
      expect(res.success).toBe(true);

      const inDb = await Workspace.findById(teamWorkspace._id);
      expect(inDb?.isArchived).toBe(true);
      expect(inDb?.archivedAt).toBeDefined();
    });
  });

  describe("deleteWorkspace", () => {
    it("refuses to delete a personal workspace", async () => {
      mockGetServerSession.mockResolvedValueOnce({
        user: { id: ownerUser._id.toString(), email: ownerUser.email, name: ownerUser.name },
      });

      await expect(
        deleteWorkspace(personalWorkspace._id.toString())
      ).rejects.toThrow("Personal Workspace cannot be archived or deleted");
    });

    it("refuses deletion by a non-owner", async () => {
      mockGetServerSession.mockResolvedValueOnce({
        user: { id: memberUser._id.toString(), email: memberUser.email, name: memberUser.name },
      });

      await expect(
        deleteWorkspace(teamWorkspace._id.toString())
      ).rejects.toThrow("Only the workspace owner can delete this workspace");
    });

    it("permanently deletes the team workspace and its memberships", async () => {
      mockGetServerSession.mockResolvedValueOnce({
        user: { id: ownerUser._id.toString(), email: ownerUser.email, name: ownerUser.name },
      });

      const res = await deleteWorkspace(teamWorkspace._id.toString());
      expect(res.success).toBe(true);

      const deleted = await Workspace.findById(teamWorkspace._id);
      expect(deleted).toBeNull();

      const remainingMemberships = await WorkspaceMembership.find({ workspaceId: teamWorkspace._id });
      expect(remainingMemberships.length).toBe(0);

      // Personal workspace and users still intact
      const preservedPersonal = await Workspace.findById(personalWorkspace._id);
      expect(preservedPersonal).not.toBeNull();
    });
  });
});

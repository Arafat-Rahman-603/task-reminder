import mongoose from "mongoose";
import User from "../src/models/User";
import Workspace from "../src/models/Workspace";
import WorkspaceMembership from "../src/models/WorkspaceMembership";
import Task from "../src/models/Task";
import { execSync } from "child_process";

describe("Workspace Migration", () => {
  beforeAll(async () => {
    if (!process.env.MONGODB_URI) throw new Error("Missing MONGODB_URI");
    await mongoose.connect(process.env.MONGODB_URI);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("should execute migration script dry-run without errors", () => {
    const stdout = execSync("npx tsx src/scripts/migrate-workspaces.ts --dry-run", { encoding: "utf8", env: { ...process.env } });
    expect(stdout).toContain("This was a dry run");
    expect(stdout).toContain("Migration Report");
  });
});

import mongoose from "mongoose";
import { execSync } from "child_process";

import dbConnect from '@/lib/db';

describe("Workspace Migration", () => {
  beforeAll(async () => {
    await dbConnect();
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  it("should execute migration script dry-run without errors", () => {
    const stdout = execSync("npx tsx src/scripts/migrate-workspaces.ts --dry-run", { encoding: "utf8", env: { ...process.env } });
    expect(stdout).toContain("This was a dry run");
    expect(stdout).toContain("Migration Report");
  });
});

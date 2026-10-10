import mongoose from "mongoose";
import { execSync } from "child_process";

describe("Workspace Migration", () => {
  beforeAll(async () => {
    const uri = process.env.TEST_MONGODB_URI || process.env.MONGODB_URI;
    if (!uri) throw new Error("Missing MONGODB_URI");
    if (uri.toLowerCase().includes("prod")) {
      throw new Error("Safety check failed: Migration integration test cannot run against production database.");
    }
    await mongoose.connect(uri);
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

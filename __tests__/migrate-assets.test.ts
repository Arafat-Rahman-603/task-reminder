import { GET, POST } from '../src/app/api/migrate-assets/route';
import { MAX_SAMPLE_SIZE } from '../src/lib/cloudinaryMigration';
import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import { getServerSession } from 'next-auth';
import User from '../src/models/User';
import Task from '../src/models/Task';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
  default: jest.fn(),
}));

jest.mock('../src/models/User', () => ({
  __esModule: true,
  default: {
    findById: jest.fn().mockReturnValue({
      lean: jest.fn(),
    }),
    find: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../src/models/Task', () => ({ __esModule: true, default: { find: jest.fn().mockResolvedValue([]) } }));
jest.mock('../src/models/Note', () => ({ __esModule: true, default: { find: jest.fn().mockResolvedValue([]) } }));
jest.mock('../src/models/Idea', () => ({ __esModule: true, default: { find: jest.fn().mockResolvedValue([]) } }));
jest.mock('../src/models/CustomRecord', () => ({ __esModule: true, default: { find: jest.fn().mockResolvedValue([]) } }), { virtual: true });
jest.mock('../src/models/custom/CustomRecord', () => ({ __esModule: true, default: { find: jest.fn().mockResolvedValue([]) } }));
jest.mock('../src/models/VaultItem', () => ({ __esModule: true, default: { find: jest.fn().mockResolvedValue([]) } }));
jest.mock('../src/models/Transaction', () => ({ __esModule: true, default: { find: jest.fn().mockResolvedValue([]) } }));
jest.mock('../src/models/Invoice', () => ({ __esModule: true, default: { find: jest.fn().mockResolvedValue([]) } }));

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    api: {
      resource: jest.fn(),
    },
    uploader: {
      rename: jest.fn(),
    },
  },
}));

jest.mock('../src/lib/db', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(true),
}));

describe('Migrate Assets API', () => {
  const originalEnv = process.env;
  const mockGetServerSession = getServerSession as jest.Mock;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockUserFindById = User.findById as unknown as jest.Mock<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockTaskFind = Task.find as unknown as jest.Mock<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.APPROVED_STAGING_CLOUD_NAME;
    delete process.env.STAGING_CLOUDINARY_CLOUD_NAME;
    process.env.CLOUDINARY_CLOUD_NAME = 'manageo-staging';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('1. Authentication & Platform Admin Authorization', () => {
    it('Denies access to unauthenticated requests (GET & POST return 401)', async () => {
      mockGetServerSession.mockResolvedValue(null);
      const resGet = await GET();
      expect(resGet.status).toBe(401);

      const reqPost = new NextRequest('http://localhost/api/migrate-assets', {
        method: 'POST',
        body: JSON.stringify({ mode: 'sample', publicIds: ['id1'] }),
      });
      const resPost = await POST(reqPost);
      expect(resPost.status).toBe(401);
    });

    it('Denies access to non-platform admin users (GET & POST return 403)', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: new mongoose.Types.ObjectId().toString() } });
      mockUserFindById().lean.mockResolvedValue({ isPlatformAdmin: false });

      const resGet = await GET();
      expect(resGet.status).toBe(403);

      const reqPost = new NextRequest('http://localhost/api/migrate-assets', {
        method: 'POST',
        body: JSON.stringify({ mode: 'sample', publicIds: ['id1'] }),
      });
      const resPost = await POST(reqPost);
      expect(resPost.status).toBe(403);
    });
  });

  describe('2. Environment Target Verification', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({ user: { id: new mongoose.Types.ObjectId().toString() } });
      mockUserFindById().lean.mockResolvedValue({ isPlatformAdmin: true });
    });

    it('Rejects requests when CLOUDINARY_CLOUD_NAME is "demo" (403)', async () => {
      process.env.CLOUDINARY_CLOUD_NAME = 'demo';
      const req = new NextRequest('http://localhost/api/migrate-assets', {
        method: 'POST',
        body: JSON.stringify({ mode: 'sample', publicIds: ['id1'] }),
      });
      const res = await POST(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('Environment validation failed');
    });

    it('Rejects requests when CLOUDINARY_CLOUD_NAME points to production (403)', async () => {
      process.env.CLOUDINARY_CLOUD_NAME = 'manageo-production';
      const req = new NextRequest('http://localhost/api/migrate-assets', {
        method: 'POST',
        body: JSON.stringify({ mode: 'sample', publicIds: ['id1'] }),
      });
      const res = await POST(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('Environment validation failed');
    });

    it('Rejects requests when CLOUDINARY_CLOUD_NAME points to live production account exgn3nrd (403)', async () => {
      process.env.CLOUDINARY_CLOUD_NAME = 'exgn3nrd';
      const req = new NextRequest('http://localhost/api/migrate-assets', {
        method: 'POST',
        body: JSON.stringify({ mode: 'sample', publicIds: ['id1'] }),
      });
      const res = await POST(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('classified as production/live');
    });

    it('Rejects requests when CLOUDINARY_CLOUD_NAME does not match explicit APPROVED_STAGING_CLOUD_NAME (403)', async () => {
      process.env.CLOUDINARY_CLOUD_NAME = 'manageo-staging';
      process.env.APPROVED_STAGING_CLOUD_NAME = 'dedicated-staging-cluster';
      const req = new NextRequest('http://localhost/api/migrate-assets', {
        method: 'POST',
        body: JSON.stringify({ mode: 'sample', publicIds: ['id1'] }),
      });
      const res = await POST(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('does not match approved staging target');
    });

    it('Rejects requests when CLOUDINARY_CLOUD_NAME is unconfigured (403)', async () => {
      delete process.env.CLOUDINARY_CLOUD_NAME;
      const req = new NextRequest('http://localhost/api/migrate-assets', {
        method: 'POST',
        body: JSON.stringify({ mode: 'sample', publicIds: ['id1'] }),
      });
      const res = await POST(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('Environment validation failed');
    });
  });

  describe('3. Allowlist Enforcement & DB Inventory Validation', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({ user: { id: new mongoose.Types.ObjectId().toString() } });
      mockUserFindById().lean.mockResolvedValue({ isPlatformAdmin: true });
      process.env.CLOUDINARY_CLOUD_NAME = 'manageo-staging';
    });

    it('Rejects requests missing explicit mode and never silently falls back to migrating all (400)', async () => {
      const req = new NextRequest('http://localhost/api/migrate-assets', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Explicit mode required');
    });

    it('Rejects sample mode if publicIds is empty or not an array (400)', async () => {
      const req1 = new NextRequest('http://localhost/api/migrate-assets', {
        method: 'POST',
        body: JSON.stringify({ mode: 'sample', publicIds: [] }),
      });
      const res1 = await POST(req1);
      expect(res1.status).toBe(400);

      const req2 = new NextRequest('http://localhost/api/migrate-assets', {
        method: 'POST',
        body: JSON.stringify({ mode: 'sample' }),
      });
      const res2 = await POST(req2);
      expect(res2.status).toBe(400);
    });

    it('Rejects sample mode if publicIds contains non-string or empty elements (400)', async () => {
      const req = new NextRequest('http://localhost/api/migrate-assets', {
        method: 'POST',
        body: JSON.stringify({ mode: 'sample', publicIds: ['valid_id', ''] }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('non-empty strings');
    });

    it('Rejects sample mode when publicIds exceeds MAX_SAMPLE_SIZE (400)', async () => {
      const tooMany = Array.from({ length: MAX_SAMPLE_SIZE + 1 }, (_, i) => `asset_${i}`);
      const req = new NextRequest('http://localhost/api/migrate-assets', {
        method: 'POST',
        body: JSON.stringify({ mode: 'sample', publicIds: tooMany }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('bounded limit');
    });

    it('Rejects sample mode when selected IDs do not exist in the DB inventory (400)', async () => {
      mockTaskFind.mockResolvedValue([
        { attachments: [{ publicId: 'existing_db_id_1' }] },
      ]);

      const req = new NextRequest('http://localhost/api/migrate-assets', {
        method: 'POST',
        body: JSON.stringify({
          mode: 'sample',
          publicIds: ['existing_db_id_1', 'non_existent_id_999'],
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Some sample IDs do not exist in the database inventory');
      expect(data.invalidIds).toEqual(['non_existent_id_999']);
    });

    it('Requires confirmAll: true when mode is "all" to prevent accidental full migration (400)', async () => {
      const req = new NextRequest('http://localhost/api/migrate-assets', {
        method: 'POST',
        body: JSON.stringify({ mode: 'all' }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('confirmAll: true');
    });
  });

  describe('4. Dry-Run Immutability & Mutation Intent', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({ user: { id: new mongoose.Types.ObjectId().toString() } });
      mockUserFindById().lean.mockResolvedValue({ isPlatformAdmin: true });
      process.env.CLOUDINARY_CLOUD_NAME = 'manageo-staging';

      mockTaskFind.mockResolvedValue([
        { attachments: [{ publicId: 'sample_asset_1' }] },
      ]);
    });

    it('Defaults to dryRun: true and NEVER mutates Cloudinary (dry-run immutability)', async () => {
      (cloudinary.api.resource as jest.Mock).mockImplementation((publicId, opts) => {
        if (opts.type === 'authenticated') {
          return Promise.reject({ http_code: 404, message: 'Resource not found' });
        }
        return Promise.resolve({
          public_id: publicId,
          type: 'upload',
          resource_type: opts.resource_type || 'image',
        });
      });

      const req = new NextRequest('http://localhost/api/migrate-assets', {
        method: 'POST',
        body: JSON.stringify({
          mode: 'sample',
          publicIds: ['sample_asset_1'],
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.dryRun).toBe(true);
      expect(data.totalWouldMigrate).toBe(1);
      expect(data.totalMigrated).toBe(0);
      expect(cloudinary.uploader.rename).not.toHaveBeenCalled();
    });

    it('Rejects execution when dryRun: false is passed without confirmMutation: true (400)', async () => {
      const req = new NextRequest('http://localhost/api/migrate-assets', {
        method: 'POST',
        body: JSON.stringify({
          mode: 'sample',
          publicIds: ['sample_asset_1'],
          dryRun: false,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Explicit mutation intent required');
      expect(cloudinary.uploader.rename).not.toHaveBeenCalled();
    });
  });

  describe('5. Cloudinary API Error Categorization (Not Converting to Null)', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({ user: { id: new mongoose.Types.ObjectId().toString() } });
      mockUserFindById().lean.mockResolvedValue({ isPlatformAdmin: true });
      process.env.CLOUDINARY_CLOUD_NAME = 'manageo-staging';

      mockTaskFind.mockResolvedValue([
        { attachments: [{ publicId: 'failing_asset_1' }] },
      ]);
    });

    it('Distinguishes 401 Authentication Failure and does NOT report "not found"', async () => {
      (cloudinary.api.resource as jest.Mock).mockRejectedValue({
        http_code: 401,
        message: 'Invalid API key or secret',
      });

      const req = new NextRequest('http://localhost/api/migrate-assets', {
        method: 'POST',
        body: JSON.stringify({
          mode: 'sample',
          publicIds: ['failing_asset_1'],
          dryRun: true,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.totalFailed).toBe(1);
      expect(data.results[1]).toContain('[AUTH_ERROR]');
      expect(data.results[1]).not.toContain('Not found on Cloudinary');
    });

    it('Distinguishes 429 Rate Limit Exceeded and does NOT report "not found"', async () => {
      (cloudinary.api.resource as jest.Mock).mockRejectedValue({
        http_code: 429,
        message: 'Rate limit exceeded for account',
      });

      const req = new NextRequest('http://localhost/api/migrate-assets', {
        method: 'POST',
        body: JSON.stringify({
          mode: 'sample',
          publicIds: ['failing_asset_1'],
          dryRun: true,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.totalFailed).toBe(1);
      expect(data.results[1]).toContain('[RATE_LIMIT]');
      expect(data.results[1]).not.toContain('Not found on Cloudinary');
    });

    it('Distinguishes Network Errors (ETIMEDOUT) and does NOT report "not found"', async () => {
      (cloudinary.api.resource as jest.Mock).mockRejectedValue({
        code: 'ETIMEDOUT',
        message: 'Connection timed out',
      });

      const req = new NextRequest('http://localhost/api/migrate-assets', {
        method: 'POST',
        body: JSON.stringify({
          mode: 'sample',
          publicIds: ['failing_asset_1'],
          dryRun: true,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.totalFailed).toBe(1);
      expect(data.results[1]).toContain('[NETWORK_ERROR]');
      expect(data.results[1]).not.toContain('Not found on Cloudinary');
    });

    it('Only reports "Not found on Cloudinary" when all types return 404', async () => {
      (cloudinary.api.resource as jest.Mock).mockRejectedValue({
        http_code: 404,
        message: 'Resource not found',
      });

      const req = new NextRequest('http://localhost/api/migrate-assets', {
        method: 'POST',
        body: JSON.stringify({
          mode: 'sample',
          publicIds: ['failing_asset_1'],
          dryRun: true,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.totalFailed).toBe(1);
      expect(data.results[1]).toContain('Not found on Cloudinary: failing_asset_1');
    });
  });

  describe('6. Partial Migration Failures & Resource Type Support', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({ user: { id: new mongoose.Types.ObjectId().toString() } });
      mockUserFindById().lean.mockResolvedValue({ isPlatformAdmin: true });
      process.env.CLOUDINARY_CLOUD_NAME = 'manageo-staging';

      mockTaskFind.mockResolvedValue([
        {
          attachments: [
            { publicId: 'success_pdf_raw' },
            { publicId: 'error_img' },
          ],
        },
      ]);
    });

    it('Handles partial migration: successfully migrates raw asset while capturing rename error on second asset', async () => {
      (cloudinary.api.resource as jest.Mock).mockImplementation((publicId, opts) => {
        if (opts.type === 'authenticated') {
          return Promise.reject({ http_code: 404, message: 'Resource not found' });
        }
        if (publicId === 'success_pdf_raw') {
          if (opts.resource_type === 'raw') {
            return Promise.resolve({
              public_id: publicId,
              type: 'upload',
              resource_type: 'raw',
            });
          }
          return Promise.reject({ http_code: 404, message: 'Resource not found' });
        }
        if (publicId === 'error_img') {
          if (opts.resource_type === 'image') {
            return Promise.resolve({
              public_id: publicId,
              type: 'upload',
              resource_type: 'image',
            });
          }
          return Promise.reject({ http_code: 404, message: 'Resource not found' });
        }
        return Promise.reject({ http_code: 404, message: 'Resource not found' });
      });

      (cloudinary.uploader.rename as jest.Mock).mockImplementation((fromId, toId, opts) => {
        if (fromId === 'success_pdf_raw') {
          return Promise.resolve({ public_id: toId, resource_type: opts.resource_type });
        }
        return Promise.reject({ http_code: 500, message: 'Internal Cloudinary rename error' });
      });

      const req = new NextRequest('http://localhost/api/migrate-assets', {
        method: 'POST',
        body: JSON.stringify({
          mode: 'sample',
          publicIds: ['success_pdf_raw', 'error_img'],
          dryRun: false,
          confirmMutation: true,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.totalRequested).toBe(2);
      expect(data.totalMigrated).toBe(1);
      expect(data.totalFailed).toBe(1);
      expect(data.success).toBe(false);

      expect(cloudinary.uploader.rename).toHaveBeenCalledWith(
        'success_pdf_raw',
        'success_pdf_raw',
        expect.objectContaining({
          resource_type: 'raw',
          to_type: 'authenticated',
        })
      );
    });

    it('Is safe on retries: skips assets already secured without re-running rename', async () => {
      mockTaskFind.mockResolvedValue([
        { attachments: [{ publicId: 'already_secured_asset' }] },
      ]);

      (cloudinary.api.resource as jest.Mock).mockImplementation((publicId, opts) => {
        if (opts.type === 'authenticated') {
          return Promise.resolve({
            public_id: publicId,
            type: 'authenticated',
            resource_type: 'image',
          });
        }
        return Promise.reject({ http_code: 404, message: 'Resource not found' });
      });

      const req = new NextRequest('http://localhost/api/migrate-assets', {
        method: 'POST',
        body: JSON.stringify({
          mode: 'sample',
          publicIds: ['already_secured_asset'],
          dryRun: false,
          confirmMutation: true,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.totalAlreadySecured).toBe(1);
      expect(data.totalMigrated).toBe(0);
      expect(data.totalFailed).toBe(0);
      expect(cloudinary.uploader.rename).not.toHaveBeenCalled();
    });
  });

  describe('7. Read-Only GET Inventory Scan', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({ user: { id: new mongoose.Types.ObjectId().toString() } });
      mockUserFindById().lean.mockResolvedValue({ isPlatformAdmin: true });
      process.env.CLOUDINARY_CLOUD_NAME = 'manageo-staging';
    });

    it('Scans DB inventory in read-only mode without mutating anything', async () => {
      mockTaskFind.mockResolvedValue([
        { attachments: [{ publicId: 'task_attachment_1' }] },
      ]);

      const res = await GET();

      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.readOnly).toBe(true);
      expect(data.dryRun).toBe(true);
      expect(data.totalDbAssets).toBe(1);
      expect(data.publicIds).toContain('task_attachment_1');
      expect(cloudinary.uploader.rename).not.toHaveBeenCalled();
    });
  });
});

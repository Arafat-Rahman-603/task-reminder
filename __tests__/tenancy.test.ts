import { getCustomFields } from '../src/actions/customSection.actions';
import { getRecentTransactions } from '../src/actions/transaction.actions';
import CustomSection from '../src/models/custom/CustomSection';
import Transaction from '../src/models/Transaction';
import mongoose from 'mongoose';

// Mock NextAuth
const mockGetServerSession = jest.fn();
jest.mock('next-auth', () => ({
  getServerSession: () => mockGetServerSession(),
  default: () => mockGetServerSession()
}));

// Mock Mongoose Models
jest.mock('../src/models/Transaction', () => ({
  __esModule: true,
  default: {
    find: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue([]),
  }
}));

jest.mock('../src/models/custom/CustomSection', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn().mockResolvedValue(null)
  }
}));

// Mock DB connection
jest.mock('../src/lib/db', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(true),
  connectToDatabase: jest.fn().mockResolvedValue(true)
}));

describe('Tenancy Regression Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Server Actions Tenancy Boundary', () => {
    it('User B cannot read User A transactions (filters by userBId)', async () => {
      const userBId = new mongoose.Types.ObjectId().toString();
      mockGetServerSession.mockResolvedValue({ user: { id: userBId } });

      await getRecentTransactions();
      
      // We expect the database query to be strictly scoped to userBId
      expect(Transaction.find).toHaveBeenCalledWith({ userId: userBId });
    });

    it('User B cannot read User A Custom Sections/Fields', async () => {
      const userBId = new mongoose.Types.ObjectId().toString();
      mockGetServerSession.mockResolvedValue({ user: { id: userBId } });
      
      const mockSectionId = new mongoose.Types.ObjectId().toString();

      try {
        await getCustomFields(mockSectionId);
      } catch (err: unknown) {
        expect((err as Error).message).toMatch(/not found/i);
      }
      
      // Verify CustomSection was queried with the correct boundaries
      expect(CustomSection.findOne).toHaveBeenCalledWith({ _id: mockSectionId, userId: userBId });
    });
  });
});

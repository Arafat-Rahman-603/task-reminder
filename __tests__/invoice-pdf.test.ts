import { GET } from '@/app/api/invoices/[id]/pdf/route';
import { generateInvoicePdfBuffer } from '@/lib/pdfGenerator';
import Invoice from '@/models/Invoice';
import mongoose from 'mongoose';
import { NextRequest } from 'next/server';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
  default: jest.fn()
}));

jest.mock('../src/lib/pdfGenerator', () => ({
  generateInvoicePdfBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-pdf'))
}));

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    url: jest.fn().mockReturnValue('https://mock-signed-url'),
    uploader: {
      upload_stream: jest.fn().mockImplementation((options, callback) => {
        return {
          end: () => callback(null, { public_id: 'mock-public-id' })
        };
      })
    }
  }
}));

jest.mock('../src/lib/db', () => jest.fn().mockResolvedValue(true));

describe('Invoice PDF Delivery & Generation', () => {
  const { getServerSession } = require('next-auth');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Denies access to unauthenticated users', async () => {
    getServerSession.mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/invoices/123/pdf');
    const res = await GET(req, { params: Promise.resolve({ id: '123' }) });
    
    expect(res.status).toBe(401);
  });

  it('Denies access to unauthorized users (not the owner)', async () => {
    getServerSession.mockResolvedValue({ user: { id: new mongoose.Types.ObjectId().toString() } });
    
    jest.spyOn(Invoice, 'findOne').mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost/api/invoices/123/pdf');
    const res = await GET(req, { params: Promise.resolve({ id: '123' }) });
    
    expect(res.status).toBe(404);
  });

  it('Redirects to signed URL if PDF already exists', async () => {
    const ownerId = new mongoose.Types.ObjectId().toString();
    getServerSession.mockResolvedValue({ user: { id: ownerId } });
    
    const mockInvoice = {
      _id: '123',
      userId: ownerId,
      pdfPublicId: 'existing-pdf-id'
    };
    
    jest.spyOn(Invoice, 'findOne').mockResolvedValueOnce(mockInvoice as any);

    const req = new NextRequest('http://localhost/api/invoices/123/pdf');
    const res = await GET(req, { params: Promise.resolve({ id: '123' }) });
    
    expect(res.status).toBe(307);
    expect(res.headers.get('Location')).toBe('https://mock-signed-url/');
    expect(res.headers.get('Cache-Control')).toBe('no-store, max-age=0');
  });

  it('Generates new PDF, uploads to Cloudinary, and returns buffer if no PDF exists', async () => {
    const ownerId = new mongoose.Types.ObjectId().toString();
    getServerSession.mockResolvedValue({ user: { id: ownerId } });
    
    const mockInvoice: any = {
      _id: '123',
      userId: ownerId,
      invoiceNumber: 'INV-00001',
      save: jest.fn().mockResolvedValue(true)
    };
    
    jest.spyOn(Invoice, 'findOne').mockResolvedValueOnce(mockInvoice as any);

    const req = new NextRequest('http://localhost/api/invoices/123/pdf');
    const res = await GET(req, { params: Promise.resolve({ id: '123' }) });
    
    expect(res.status).toBe(200);
    expect(generateInvoicePdfBuffer).toHaveBeenCalled();
    expect(mockInvoice.pdfPublicId).toBe('mock-public-id');
    expect(mockInvoice.save).toHaveBeenCalled();
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    expect(res.headers.get('Cache-Control')).toBe('no-store, max-age=0');
  });
});

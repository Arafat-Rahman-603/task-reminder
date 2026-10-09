import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: mongoose.Types.Decimal128;
  amount: mongoose.Types.Decimal128;
}

export interface IInvoice extends Document {
  userId: Types.ObjectId; // Strict ownership, isolated from workspaces
  transactionId?: Types.ObjectId;
  invoiceNumber: string; // Unique sequential number
  
  status: 'draft' | 'issued' | 'paid' | 'voided';
  
  issueDate: Date;
  dueDate?: Date;
  
  clientName: string;
  clientEmail?: string;
  clientAddress?: string;

  items: IInvoiceItem[];
  subtotal: mongoose.Types.Decimal128;
  taxRate?: number;
  taxAmount?: mongoose.Types.Decimal128;
  discountAmount?: mongoose.Types.Decimal128;
  totalAmount: mongoose.Types.Decimal128;
  currency: string;
  
  notes?: string;
  
  pdfUrl?: string;
  pdfPublicId?: string;
  
  qrVerificationToken?: string; // Opaque reference for public verification
  
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema = new Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Schema.Types.Decimal128, required: true },
  amount: { type: Schema.Types.Decimal128, required: true }
});

const InvoiceSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction' },
  invoiceNumber: { type: String, required: true, unique: true },
  
  status: { type: String, enum: ['draft', 'issued', 'paid', 'voided'], default: 'draft' },
  
  issueDate: { type: Date, required: true },
  dueDate: { type: Date },
  
  clientName: { type: String, required: true },
  clientEmail: { type: String },
  clientAddress: { type: String },

  items: [InvoiceItemSchema],
  subtotal: { type: Schema.Types.Decimal128, required: true },
  taxRate: { type: Number, default: 0 },
  taxAmount: { type: Schema.Types.Decimal128 },
  discountAmount: { type: Schema.Types.Decimal128 },
  totalAmount: { type: Schema.Types.Decimal128, required: true },
  currency: { type: String, default: 'BDT' },
  
  notes: { type: String },
  
  pdfUrl: { type: String },
  pdfPublicId: { type: String },
  
  qrVerificationToken: { type: String, unique: true, sparse: true, index: true },
}, { timestamps: true });

export default mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);

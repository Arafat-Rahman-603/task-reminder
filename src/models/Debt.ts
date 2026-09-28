import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IDebtPayment {
  date: Date;
  amount: mongoose.Types.Decimal128;
  notes?: string;
}

export interface IDebt extends Document {
  userId: Types.ObjectId;
  type: 'OWED_BY_ME' | 'OWED_TO_ME';
  name: string; // E.g., "Student Loan" or "John owes me"
  principalAmount: mongoose.Types.Decimal128;
  outstandingAmount: mongoose.Types.Decimal128;
  currency: string;
  interestRate?: number;
  dueDate?: Date;
  payments: IDebtPayment[];
  notes?: string;
  status: 'Active' | 'Paid' | 'Forgiven';
  createdAt: Date;
  updatedAt: Date;
}

const DebtSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['OWED_BY_ME', 'OWED_TO_ME'], required: true },
  name: { type: String, required: true },
  principalAmount: { type: Schema.Types.Decimal128, required: true },
  outstandingAmount: { type: Schema.Types.Decimal128, required: true },
  currency: { type: String, default: 'BDT' },
  interestRate: { type: Number },
  dueDate: { type: Date },
  payments: [{
    date: { type: Date, required: true },
    amount: { type: Schema.Types.Decimal128, required: true },
    notes: { type: String }
  }],
  notes: { type: String },
  status: { type: String, enum: ['Active', 'Paid', 'Forgiven'], default: 'Active' }
}, { timestamps: true });

export default mongoose.models.Debt || mongoose.model<IDebt>('Debt', DebtSchema);

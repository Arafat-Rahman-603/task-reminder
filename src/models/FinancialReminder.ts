import mongoose, { Schema, Document, Types } from 'mongoose';

export type FinancialReminderCategory =
  | 'bill'
  | 'bill_utility'
  | 'rent_housing'
  | 'insurance_premium'
  | 'subscription'
  | 'loan'
  | 'loan_installment'
  | 'credit_card'
  | 'investment_contribution'
  | 'investment_maturity'
  | 'dividend'
  | 'dividend_interest'
  | 'portfolio_review'
  | 'watchlist_review'
  | 'savings_goal'
  | 'planned_transfer'
  | 'income'
  | 'salary_income'
  | 'receivable_followup'
  | 'tax'
  | 'tax_deadline'
  | 'document_expiry'
  | 'custom';

export type FinancialRecurrenceFrequency =
  | 'none'
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'semi_annually'
  | 'yearly'
  | 'custom'
  | 'custom_days';

export interface IFinancialReminderHistory {
  occurrenceDate: Date;
  completedAt: Date;
  status: 'paid' | 'completed' | 'skipped';
  transactionId?: Types.ObjectId;
  amountPaid?: mongoose.Types.Decimal128;
  notes?: string;
}

export interface IFinancialReminder extends Document {
  userId: Types.ObjectId;
  title: string;
  category: FinancialReminderCategory;
  subCategory?: string;
  amount?: mongoose.Types.Decimal128;
  isEstimatedAmount: boolean;
  currency: string;
  dueDate: Date;
  dueTime?: string;
  accountId?: Types.ObjectId;
  linkedEntityType?: 'Account' | 'Debt' | 'Investment' | 'Goal' | 'Subscription' | 'Transaction';
  linkedEntityId?: Types.ObjectId;
  recurrence: FinancialRecurrenceFrequency;
  recurrenceInterval?: number;
  recurrenceEnd?: {
    type: 'never' | 'after_occurrences' | 'on_date';
    occurrences?: number;
    endDate?: Date;
  };
  advanceDays: number[];
  notificationChannels: ('in-app' | 'push' | 'email')[];
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  notes?: string;
  history: IFinancialReminderHistory[];
  nextDueDate: Date;
  occurrenceCount: number;
  autoCreateTransaction?: boolean;
  timezone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FinancialReminderHistorySchema = new Schema(
  {
    occurrenceDate: { type: Date, required: true },
    completedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['paid', 'completed', 'skipped'], default: 'completed' },
    transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction' },
    amountPaid: { type: Schema.Types.Decimal128 },
    notes: { type: String },
  },
  { _id: false }
);

const FinancialReminderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        'bill',
        'bill_utility',
        'rent_housing',
        'insurance_premium',
        'subscription',
        'loan',
        'loan_installment',
        'credit_card',
        'investment_contribution',
        'investment_maturity',
        'dividend',
        'dividend_interest',
        'portfolio_review',
        'watchlist_review',
        'savings_goal',
        'planned_transfer',
        'income',
        'salary_income',
        'receivable_followup',
        'tax',
        'tax_deadline',
        'document_expiry',
        'custom',
      ],
      required: true,
      index: true,
    },
    subCategory: { type: String },
    amount: { type: Schema.Types.Decimal128 },
    isEstimatedAmount: { type: Boolean, default: false },
    currency: { type: String, default: 'BDT' },
    dueDate: { type: Date, required: true, index: true },
    dueTime: { type: String }, // Format "HH:mm"
    accountId: { type: Schema.Types.ObjectId, ref: 'Account', index: true },
    linkedEntityType: {
      type: String,
      enum: ['Account', 'Debt', 'Investment', 'Goal', 'Subscription', 'Transaction'],
    },
    linkedEntityId: { type: Schema.Types.ObjectId, index: true },
    recurrence: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semi_annually', 'yearly', 'custom', 'custom_days'],
      default: 'none',
    },
    recurrenceInterval: { type: Number, default: 1 },
    recurrenceEnd: {
      type: {
        type: String,
        enum: ['never', 'after_occurrences', 'on_date'],
        default: 'never',
      },
      occurrences: { type: Number },
      endDate: { type: Date },
    },
    advanceDays: { type: [Number], default: [0, 1] },
    notificationChannels: {
      type: [String],
      enum: ['in-app', 'push', 'email'],
      default: ['in-app', 'push'],
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'paused', 'cancelled'],
      default: 'active',
      index: true,
    },
    notes: { type: String },
    history: { type: [FinancialReminderHistorySchema], default: [] },
    nextDueDate: { type: Date, required: true, index: true },
    occurrenceCount: { type: Number, default: 0 },
    autoCreateTransaction: { type: Boolean, default: false },
    timezone: { type: String, default: 'UTC' },
  },
  { timestamps: true }
);

// High performance compound indexes for personal scoping and due-date calendar queries
FinancialReminderSchema.index({ userId: 1, status: 1, nextDueDate: 1 });
FinancialReminderSchema.index({ userId: 1, category: 1, nextDueDate: 1 });
FinancialReminderSchema.index({ userId: 1, accountId: 1 });
FinancialReminderSchema.index({ userId: 1, linkedEntityId: 1 });

export default mongoose.models.FinancialReminder ||
  mongoose.model<IFinancialReminder>('FinancialReminder', FinancialReminderSchema);

import mongoose, { Schema, Document, Types } from 'mongoose';

export type BlockType = 
  | 'stat' 
  | 'progress' 
  | 'status_summary' 
  | 'chart' 
  | 'record_list' 
  | 'record_table' 
  | 'recent' 
  | 'text' 
  | 'divider' 
  | 'spacer';

export interface IDashboardBlock extends Document {
  sectionId: string;
  userId: Types.ObjectId;
  type: BlockType;
  title?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: any;
  order: number;
  width: 'compact' | 'half' | 'full';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DashboardBlockSchema: Schema = new Schema({
  sectionId: { type: String, required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { 
    type: String, 
    enum: [
      'stat', 'progress', 'status_summary', 'chart', 'record_list', 
      'record_table', 'recent', 'text', 'divider', 'spacer'
    ], 
    required: true 
  },
  title: { type: String },
  config: { type: Schema.Types.Mixed, default: {} },
  order: { type: Number, default: 0 },
  width: { type: String, enum: ['compact', 'half', 'full'], default: 'full' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.DashboardBlock || mongoose.model<IDashboardBlock>('DashboardBlock', DashboardBlockSchema);

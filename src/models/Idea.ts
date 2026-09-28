import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IIdea extends Document {
  userId: Types.ObjectId;
  title: string;
  description?: string;
  content?: string;
  status: 'Inbox' | 'Exploring' | 'Planned' | 'In Progress' | 'On Hold' | 'Completed' | 'Archived';
  priority: 'Low' | 'Medium' | 'High';
  tags: string[];
  targetDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const IdeaSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String },
  content: { type: String },
  status: { 
    type: String, 
    enum: ['Inbox', 'Exploring', 'Planned', 'In Progress', 'On Hold', 'Completed', 'Archived'], 
    default: 'Inbox' 
  },
  priority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High'], 
    default: 'Medium' 
  },
  tags: { type: [String], default: [] },
  targetDate: { type: Date },
}, { timestamps: true });

export default mongoose.models.Idea || mongoose.model<IIdea>('Idea', IdeaSchema);

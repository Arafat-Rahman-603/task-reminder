import mongoose, { Schema, Document, Types } from 'mongoose';

export interface INavigationGroup extends Document {
  userId: Types.ObjectId;
  name: string;
  icon?: string;
  sortOrder: number;
  isCollapsed: boolean;
  items: {
    id: string; // matches SYSTEM_MODULES id or custom section slug
    type: 'module' | 'custom' | 'link';
    label: string;
    icon?: string;
    href: string;
    sortOrder: number;
    isHidden: boolean;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const NavigationGroupSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  icon: { type: String },
  sortOrder: { type: Number, default: 0 },
  isCollapsed: { type: Boolean, default: false },
  items: [{
    id: { type: String, required: true },
    type: { type: String, enum: ['module', 'custom', 'link'], required: true },
    label: { type: String, required: true },
    icon: { type: String },
    href: { type: String, required: true },
    sortOrder: { type: Number, default: 0 },
    isHidden: { type: Boolean, default: false }
  }]
}, { timestamps: true });

export default mongoose.models.NavigationGroup || mongoose.model<INavigationGroup>('NavigationGroup', NavigationGroupSchema);

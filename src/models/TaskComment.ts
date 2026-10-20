import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITaskComment extends Document {
  taskId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  userId: Types.ObjectId;
  content: string;
  attachments?: {
    url: string;
    publicId: string;
    resourceType?: string;
    originalFilename?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const TaskCommentSchema: Schema = new Schema(
  {
    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true, index: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    content: { type: String, required: true, trim: true, maxlength: 5000 },
    attachments: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
        resourceType: { type: String },
        originalFilename: { type: String },
      },
    ],
  },
  { timestamps: true }
);

TaskCommentSchema.index({ taskId: 1, createdAt: 1 });

export default mongoose.models.TaskComment ||
  mongoose.model<ITaskComment>("TaskComment", TaskCommentSchema);

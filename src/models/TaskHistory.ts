import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITaskHistory extends Document {
  userId: Types.ObjectId;
  taskId: Types.ObjectId;
  taskTitle: string;
  action: string;
  field?: string;
  previousValue?: string;
  newValue?: string;
  timestamp: Date;
}

const TaskHistorySchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true, index: true },
  taskTitle: { type: String, required: true },
  action: { type: String, required: true },
  field: { type: String },
  previousValue: { type: String },
  newValue: { type: String },
  timestamp: { type: Date, default: Date.now, index: true },
});

TaskHistorySchema.index({ taskId: 1, timestamp: -1 });
TaskHistorySchema.index({ userId: 1, timestamp: -1 });

export default mongoose.models.TaskHistory || mongoose.model("TaskHistory", TaskHistorySchema);

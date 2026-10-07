import mongoose, { Schema, Document, Types } from "mongoose";

export interface IRoutineHistory extends Document {
  userId: Types.ObjectId;
  routineId: Types.ObjectId;
  routineName: string;
  occurrenceDate: Date;
  scheduledTime?: string;
  status: "Scheduled" | "Completed" | "Missed";
  completedAt?: Date;
  items: {
    title: string;
    isCompleted: boolean;
  }[];
  timestamp: Date;
}

const RoutineHistorySchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  routineId: { type: Schema.Types.ObjectId, ref: "Routine", required: true, index: true },
  routineName: { type: String, required: true },
  occurrenceDate: { type: Date, required: true },
  scheduledTime: { type: String },
  status: { type: String, enum: ["Scheduled", "Completed", "Missed"], default: "Scheduled" },
  completedAt: { type: Date },
  items: [{
    title: { type: String, required: true },
    isCompleted: { type: Boolean, default: false }
  }],
  timestamp: { type: Date, default: Date.now, index: true },
});

RoutineHistorySchema.index({ routineId: 1, occurrenceDate: -1 });

export default mongoose.models.RoutineHistory || mongoose.model("RoutineHistory", RoutineHistorySchema);

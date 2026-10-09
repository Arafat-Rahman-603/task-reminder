import mongoose, { Schema, Document } from 'mongoose';

export interface ICounter extends Document<string> {
  _id: string; // The ID will be the counter name, e.g. "invoiceNumber"
  seq: number;
}

const CounterSchema: Schema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

export default mongoose.models.Counter || mongoose.model<ICounter>('Counter', CounterSchema);

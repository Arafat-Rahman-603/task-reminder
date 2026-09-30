import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const CustomSectionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  group: { type: String },
  icon: { type: String },
  description: { type: String },
  layout: { type: String, default: 'list' },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const CustomSection = mongoose.models.CustomSection || mongoose.model('CustomSection', CustomSectionSchema);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  
  const userId = new mongoose.Types.ObjectId().toString();
  const doc = await CustomSection.create({ userId, name: "Test CS", slug: "test-cs" });
  console.log("Created:", doc._id);
  
  try {
    const updated = await CustomSection.findOneAndUpdate(
      { _id: doc._id.toString(), userId: userId },
      { $set: { name: "Updated Test CS", icon: "" } },
      { new: true }
    );
    console.log("Updated:", !!updated);
    
    const deleted = await CustomSection.findOneAndDelete({ _id: doc._id.toString(), userId: userId });
    console.log("Deleted:", !!deleted);
  } catch (e: any) {
    console.error("Error:", e.message);
  }
  
  process.exit(0);
}

run();

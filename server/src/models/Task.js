import mongoose from "mongoose";
const taskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: [true, "Title is required"], trim: true, minlength: 1, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 1000, default: "" },
  status: { type: String, enum: ["Pending", "In Progress", "Completed"], default: "Pending" },
  priority: { type: String, enum: ["High", "Medium", "Low"], default: "Medium" },
  dueDate: { type: Date }
}, { timestamps: true });
taskSchema.index({ user: 1, createdAt: -1 });
taskSchema.index({ user: 1, dueDate: 1 });
export default mongoose.model("Task", taskSchema);

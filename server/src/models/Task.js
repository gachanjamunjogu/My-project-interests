import mongoose from "mongoose"

const { Schema } = mongoose

export const TASK_STATUSES = ["backlog", "todo", "in-progress", "review", "done"]

const taskSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 5000 },
    status: { type: String, enum: TASK_STATUSES, default: "todo", index: true },
    priority: { type: Number, min: 1, max: 5, default: 3, index: true },
    category: { type: String, trim: true, maxlength: 80, index: true },
    estimatedDurationMin: { type: Number, min: 0, max: 24 * 60 },
    dueAt: { type: Date },
    ai: {
      source: { type: String, enum: ["manual", "gemini"], default: "manual" },
      confidence: { type: Number, min: 0, max: 1 },
    },
  },
  { timestamps: true }
)

taskSchema.index({ userId: 1, status: 1, updatedAt: -1 })
taskSchema.index(
  { title: "text", description: "text", category: "text" },
  { weights: { title: 5, category: 2, description: 1 } }
)

export const Task = mongoose.models.Task || mongoose.model("Task", taskSchema)


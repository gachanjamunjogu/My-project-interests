import mongoose from "mongoose"

const { Schema } = mongoose

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 320,
    },
    passwordHash: { type: String, required: true },
    name: { type: String, trim: true, maxlength: 120 },
    privacy: {
      anonymizedTelemetry: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
)

userSchema.index({ email: 1 }, { unique: true })

export const User = mongoose.models.User || mongoose.model("User", userSchema)


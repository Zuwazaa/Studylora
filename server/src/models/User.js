import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    grade: { type: Number, min: 1, max: 11, default: null },
    lang: { type: String, enum: ["uz", "ru"], default: "uz" },
    resetTokenHash: String,
    resetTokenExpires: Date,
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);

import mongoose from "mongoose";

// O'quvchi o'zi yuklagan PDF kitob. Matni BookText'da ("course:<id>"), fayl R2'da.
const courseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, maxlength: 160 },
    fileName: String,
    fileUrl: String,
    fileKey: String,
    numPages: Number,
    intro: String,
    status: { type: String, enum: ["active", "closed"], default: "active" },
  },
  { timestamps: true }
);

export default mongoose.model("Course", courseSchema);

import mongoose from "mongoose";

// Chatga yuborilgan rasm (kitobdan belgilangan qism yoki foto)
const attachmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    page: { type: Number, default: null },
    mime: { type: String, required: true },
    data: { type: Buffer, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Attachment", attachmentSchema);

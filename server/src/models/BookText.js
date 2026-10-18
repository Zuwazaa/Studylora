import mongoose from "mongoose";

const pageSchema = new mongoose.Schema({ page: Number, text: String }, { _id: false });
const tocSchema = new mongoose.Schema({ title: String, page: Number, depth: Number }, { _id: false });

/* Darslik va yuklangan PDF'lar matni (test tuzish va RAG uchun).
   key: "book:10-algebra" yoki "course:<id>". */
const bookTextSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    numPages: { type: Number, default: 0 },
    toc: { type: [tocSchema], default: [] },
    pages: { type: [pageSchema], default: [] },
    scanned: { type: Boolean, default: false }, // matn qatlami yo'q — Gemini PDF'ni o'zi o'qiydi
    geminiFile: { uri: String, mimeType: String, expiresAt: Number },
    status: { type: String, enum: ["ready", "processing", "failed"], default: "processing" },
    error: String,
  },
  { timestamps: true }
);

export default mongoose.model("BookText", bookTextSchema);

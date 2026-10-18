import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "ai"], required: true },
    text: { type: String, default: "" },
    attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Attachment" }],
    mode: String,
    skills: [String],
    sources: [{ title: String, url: String, _id: false }],
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// key: "general" | "book:10-algebra" | "course:<id>"
const conversationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    key: { type: String, required: true, maxlength: 100 },
    title: { type: String, default: "", maxlength: 120 },
    mode: { type: String, default: "explain" },
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true }
);

conversationSchema.index({ userId: 1, key: 1, updatedAt: -1 });

export default mongoose.model("Conversation", conversationSchema);

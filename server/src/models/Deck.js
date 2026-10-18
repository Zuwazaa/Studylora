import mongoose from "mongoose";

// Flashcard kartochkasi + SM-2 holati
const cardSchema = new mongoose.Schema({
  front: { type: String, required: true },
  back: { type: String, required: true },
  ef: { type: Number, default: 2.5 },
  interval: { type: Number, default: 0 },
  reps: { type: Number, default: 0 },
  due: { type: Number, default: Date.now },
});

const deckSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, maxlength: 140 },
    subject: String,
    grade: String,
    source: String, // "10-algebra, 45-52 betlar" kabi
    cards: { type: [cardSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("Deck", deckSchema);

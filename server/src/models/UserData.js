import mongoose from "mongoose";

// Xato qilingan savol. Oraliqli takrorlash (SM-2) maydonlari bilan.
const mistakeSchema = new mongoose.Schema(
  {
    question: String,
    options: [String],
    subject: String,
    grade: String,
    topic: String,
    bloom: String,
    yourAnswer: String,
    correctAnswer: String,
    explain: String,
    misconception: String,
    confident: Boolean, // "ishonib xato qilingan" — eng xavfli bo'shliq
    date: { type: Number, default: Date.now },
    ef: { type: Number, default: 2.5 },
    interval: { type: Number, default: 0 },
    reps: { type: Number, default: 0 },
    due: { type: Number, default: Date.now },
  },
  { _id: true }
);

const quizResultSchema = new mongoose.Schema(
  {
    subject: String,
    grade: String,
    topic: String,
    difficulty: String,
    score: Number,
    total: Number,
    bloom: { type: Object, default: {} }, // daraja -> { ok, total }
    calibration: { type: Object, default: {} }, // { sureWrong, unsureRight, ... }
    seconds: Number,
    date: { type: Number, default: Date.now },
  },
  { _id: false }
);

const userDataSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    streakDates: { type: [String], default: [] },
    mistakes: { type: [mistakeSchema], default: [] },
    quizHistory: { type: [quizResultSchema], default: [] },
    mastery: { type: Object, default: {} }, // fan nomi -> 0..100
    bloom: { type: Object, default: {} }, // umumiy Blum profili: daraja -> { ok, total }
    dayLog: { type: [{ d: String, n: Number, m: Number, _id: false }], default: [] },
    dailyGoal: { type: Number, default: 3 },
    counters: { type: Object, default: {} }, // tests, correct, chat, book, cards, minutes
  },
  { timestamps: true, minimize: false }
);

export default mongoose.model("UserData", userDataSchema);

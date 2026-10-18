import { Router } from "express";
import UserData from "../models/UserData.js";
import { requireAuth } from "../middleware/auth.js";
import { updateData, touch, publicData, activity } from "../lib/userdata.js";
import { review } from "../pedagogy/sm2.js";

const router = Router();
router.use(requireAuth);

router.get("/data", async (req, res) => {
  res.json(publicData(await UserData.findOne({ userId: req.userId })));
});

// Kitob ochildi, dars ko'rildi va h.k.
router.post("/activity", async (req, res) => {
  const kind = ["book", "lesson", "chat"].includes(req.body?.kind) ? req.body.kind : "lesson";
  res.json(publicData(await activity(req.userId, kind)));
});

// O'qishga sarflangan daqiqalar (frontend faol vaqtni sanab yuboradi)
router.post("/time", async (req, res) => {
  const minutes = Math.min(30, Math.max(1, Math.round(Number(req.body?.minutes) || 0)));
  res.json(publicData(await updateData(req.userId, (d) => touch(d, null, minutes))));
});

router.patch("/goal", async (req, res) => {
  const goal = Math.min(10, Math.max(1, Math.round(Number(req.body?.goal) || 3)));
  res.json(publicData(await updateData(req.userId, (d) => { d.dailyGoal = goal; })));
});

/* Xatolarni oraliqli takrorlash: body { id, quality: 0..5 }.
   4+ bilan ketma-ket 3 marta eslangan xato "o'zlashtirildi" deb ro'yxatdan chiqadi. */
router.post("/mistakes/review", async (req, res) => {
  const id = String(req.body?.id || "");
  const quality = Number(req.body?.quality);
  const d = await updateData(req.userId, (doc) => {
    const m = doc.mistakes.id(id);
    if (!m) return;
    Object.assign(m, review(m, quality));
    if (m.reps >= 3 && quality >= 4) doc.mistakes.pull(id);
    touch(doc, "review");
  });
  res.json(publicData(d));
});

router.delete("/mistakes/:id", async (req, res) => {
  const d = await updateData(req.userId, (doc) => { doc.mistakes.pull(req.params.id); });
  res.json(publicData(d));
});

export default router;

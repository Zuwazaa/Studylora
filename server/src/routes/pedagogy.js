import { Router } from "express";
import { publicSkills, publicModes } from "../pedagogy/skills.js";

const router = Router();

// Ochiq: platformaga o'rnatilgan pedagog skillari va ustoz rejimlari
router.get("/", (req, res) => {
  res.set("Cache-Control", "public, max-age=600");
  res.json({ skills: publicSkills(), modes: publicModes() });
});

export default router;

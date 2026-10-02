import { Router } from "express";
import { store } from "../data/store.js";

const router = Router();

// GET /api/settings
router.get("/", (req, res) => {
  res.json({ success: true, settings: store.settings });
});

// PUT /api/settings
router.put("/", (req, res) => {
  const updates = req.body;
  store.settings = { ...store.settings, ...updates };

  // Audit
  store.auditLogs.unshift({
    id: store.auditLogs.length + 1,
    officer: "Admin",
    action: "System Settings Updated",
    target: "SETTINGS-GLOBAL",
    ip: req.ip || "127.0.0.1",
    date: "Just now",
    status: "success",
  });

  res.json({ success: true, settings: store.settings });
});

export default router;

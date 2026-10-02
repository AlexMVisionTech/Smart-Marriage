import { Router } from "express";
import { isDbAvailable, query } from "../db.js";
import { store } from "../data/store.js";

const router = Router();

// GET /api/audit - Get all audit logs with optional search
router.get("/", async (req, res) => {
  try {
    const { search = "" } = req.query;

    if (!isDbAvailable()) {
      let logs = [...store.auditLogs];

      if (search) {
        const q = search.toLowerCase();
        logs = logs.filter(
          (l) =>
            l.officer?.toLowerCase().includes(q) ||
            l.action?.toLowerCase().includes(q) ||
            l.target?.toLowerCase().includes(q) ||
            l.ip?.includes(q)
        );
      }

      return res.json({ success: true, count: logs.length, logs });
    }

    const params = [];
    let sql = "SELECT id, officer, action, target, ip, date, status FROM audit_logs";
    if (search) {
      params.push(`%${search}%`);
      sql += " WHERE officer ILIKE $1 OR action ILIKE $1 OR target ILIKE $1 OR ip ILIKE $1";
    }
    sql += " ORDER BY created_at DESC, id DESC";

    const result = await query(sql, params);
    res.json({ success: true, count: result.rows.length, logs: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/audit - Record custom audit log
router.post("/", async (req, res) => {
  const { officer = "System", action, target, status = "success" } = req.body;

  if (!action || !target) {
    return res.status(400).json({ success: false, message: "action and target are required" });
  }

  const date = new Date().toLocaleString();

  if (isDbAvailable()) {
    try {
      const result = await query(
        `INSERT INTO audit_logs (officer, action, target, ip, date, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, officer, action, target, ip, date, status`,
        [officer, action, target, req.ip || "127.0.0.1", date, status]
      );
      return res.status(201).json({ success: true, log: result.rows[0] });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  const newLog = {
    id: store.auditLogs.length + 1,
    officer,
    action,
    target,
    ip: req.ip || "127.0.0.1",
    date,
    status,
  };

  store.auditLogs.unshift(newLog);
  res.status(201).json({ success: true, log: newLog });
});

export default router;

import { Router } from "express";
import { isDbAvailable, query } from "../db.js";
import { store } from "../data/store.js";

const router = Router();

// GET /api/users - List users
router.get("/", async (req, res) => {
  try {
    const { role } = req.query;

    if (!isDbAvailable()) {
      let users = store.users;
      if (role) {
        users = users.filter((u) => u.role === role);
      }
      return res.json({ success: true, count: users.length, users });
    }

    const params = [];
    let sql = "SELECT id, name, email, role, national_id, phone, title, department, badge_id, nationality, status, avatar FROM users";
    if (role) {
      sql += " WHERE role = $1";
      params.push(role);
    }
    sql += " ORDER BY created_at DESC";

    const result = await query(sql, params);
    const users = result.rows.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      nationalId: user.national_id,
      phone: user.phone,
      title: user.title,
      department: user.department,
      badgeId: user.badge_id,
      nationality: user.nationality,
      status: user.status,
      avatar: user.avatar,
    }));

    res.json({ success: true, count: users.length, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/users/:id
router.get("/:id", async (req, res) => {
  try {
    if (!isDbAvailable()) {
      const user = store.users.find((u) => u.id === req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      return res.json({ success: true, user });
    }

    const result = await query(
      "SELECT id, name, email, role, national_id, phone, title, department, badge_id, nationality, status, avatar FROM users WHERE id = $1",
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = result.rows[0];
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        nationalId: user.national_id,
        phone: user.phone,
        title: user.title,
        department: user.department,
        badgeId: user.badge_id,
        nationality: user.nationality,
        status: user.status,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

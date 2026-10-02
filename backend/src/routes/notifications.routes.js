import { Router } from "express";
import { isDbAvailable, query } from "../db.js";
import { store } from "../data/store.js";

const router = Router();

const mapNotification = (row) => ({
  id: row.id,
  type: row.type,
  title: row.title,
  message: row.message,
  read: row.read,
  userId: row.user_id,
  time: row.created_at,
});

// GET /api/notifications
router.get("/", async (req, res) => {
  try {
    const { filter = "all", userId } = req.query;
    let notifs = [...store.notifications];

    if (!isDbAvailable()) {
      if (userId) {
        notifs = notifs.filter((n) => !n.userId || n.userId === userId);
      }

      if (filter === "unread") {
        notifs = notifs.filter((n) => !n.read);
      } else if (filter !== "all") {
        notifs = notifs.filter((n) => n.type === filter);
      }

      const unreadCount = store.notifications.filter((n) => !n.read).length;

      return res.json({
        success: true,
        count: notifs.length,
        unreadCount,
        notifications: notifs,
      });
    }

    const params = [];
    const filters = [];
    if (userId) {
      params.push(userId);
      filters.push(`(user_id IS NULL OR user_id = $${params.length})`);
    }
    if (filter === "unread") {
      filters.push("read = FALSE");
    } else if (filter !== "all") {
      params.push(filter);
      filters.push(`type = $${params.length}`);
    }

    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    const result = await query(
      `SELECT id, user_id, type, title, message, read, created_at FROM notifications ${where} ORDER BY created_at DESC`,
      params
    );
    const unreadResult = await query(
      userId
        ? "SELECT COUNT(*) FROM notifications WHERE read = FALSE AND (user_id IS NULL OR user_id = $1)"
        : "SELECT COUNT(*) FROM notifications WHERE read = FALSE",
      userId ? [userId] : []
    );

    res.json({
      success: true,
      count: result.rows.length,
      unreadCount: parseInt(unreadResult.rows[0].count, 10),
      notifications: result.rows.map(mapNotification),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch("/:id/read", async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isDbAvailable()) {
    try {
      const result = await query(
        "UPDATE notifications SET read = TRUE WHERE id = $1 RETURNING id, user_id, type, title, message, read, created_at",
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Notification not found" });
      }
      return res.json({ success: true, notification: mapNotification(result.rows[0]) });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  const notif = store.notifications.find((n) => n.id === id);

  if (!notif) {
    return res.status(404).json({ success: false, message: "Notification not found" });
  }

  notif.read = true;
  res.json({ success: true, notification: notif });
});

// POST /api/notifications/read-all - Mark all as read
router.post("/read-all", async (req, res) => {
  const { userId } = req.query;

  if (isDbAvailable()) {
    try {
      if (userId) {
        await query("UPDATE notifications SET read = TRUE WHERE user_id IS NULL OR user_id = $1", [userId]);
      } else {
        await query("UPDATE notifications SET read = TRUE");
      }
      return res.json({ success: true, message: "All notifications marked as read" });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  store.notifications.forEach((n) => {
    if (!userId || !n.userId || n.userId === userId) {
      n.read = true;
    }
  });
  res.json({ success: true, message: "All notifications marked as read" });
});

export default router;

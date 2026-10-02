import { Router } from "express";
import { isDbAvailable, query } from "../db.js";
import { store } from "../data/store.js";

const router = Router();

const toPublicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  title: user.title,
  department: user.department,
  nationalId: user.national_id || user.nationalId,
  phone: user.phone,
  nationality: user.nationality,
  status: user.status,
  avatar: user.avatar || (user.name ? user.name.substring(0, 2).toUpperCase() : "U"),
});

// GET /api/auth/status - Check DB connection
router.get("/status", async (req, res) => {
  try {
    const result = await query("SELECT NOW() as db_time, current_database() as db_name");
    res.json({
      success: true,
      status: "connected",
      database: result.rows[0].db_name,
      serverTime: result.rows[0].db_time,
      provider: "Neon PostgreSQL",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      status: "disconnected",
      error: err.message,
    });
  }
});

// POST /api/auth/login - Authenticate against PostgreSQL database
router.post("/login", async (req, res) => {
  try {
    const { email, password, role = "citizen", ssoProvider } = req.body;
    let user = null;

    if (!isDbAvailable()) {
      const cleanEmail = email?.trim().toLowerCase();
      user = cleanEmail
        ? store.users.find(
            (u) => u.email.toLowerCase() === cleanEmail || u.nationalId === email.trim()
          )
        : null;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found. Please enter your registered email or national ID.",
        });
      }

      if (role && user.role !== role) {
        return res.status(403).json({
          success: false,
          message: `This account is not authorised for the selected portal.`,
        });
      }

      store.auditLogs.unshift({
        id: store.auditLogs.length + 1,
        officer: user.name,
        action: ssoProvider
          ? `Login (${user.role}) via ${ssoProvider === "huduma_namba" ? "Huduma Namba" : "eCitizen SSO"}`
          : `User Login (${user.role}) via Credentials`,
        target: user.id,
        ip: req.ip || "127.0.0.1",
        date: "Just now",
        status: "success",
      });

      return res.json({
        success: true,
        token: `jwt-memory-${user.id}-${Date.now()}`,
        source: "memory_store",
        user,
      });
    }

    if (email && email.trim()) {
      const cleanEmail = email.trim();
      const userRes = await query(
        `SELECT * FROM users 
         WHERE LOWER(email) = LOWER($1) OR national_id = $1 
         LIMIT 1`,
        [cleanEmail]
      );
      if (userRes.rows.length > 0) {
        user = userRes.rows[0];
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found. Please enter your registered email or national ID.",
      });
    }

    if (role && user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `This account is not authorised for the selected portal.`,
      });
    }

    // Check password if provided and not default placeholder
    if (password && password !== "••••••••" && user.password && user.password !== "••••••••") {
      if (user.password !== password) {
        return res.status(401).json({
          success: false,
          message: "Incorrect password. Please try again.",
        });
      }
    }

    // Record login audit log in PostgreSQL
    const nowStr = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const auditAction = ssoProvider
      ? `Biometric Login (${user.role}) via ${ssoProvider === "huduma_namba" ? "Huduma Namba" : "eCitizen SSO"}`
      : `User Login (${user.role}) via Credentials`;

    try {
      await query(
        `INSERT INTO audit_logs (officer, action, target, ip, date, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          user.name,
          auditAction,
          user.id,
          req.ip || "127.0.0.1",
          nowStr,
          "success",
        ]
      );
    } catch (auditErr) {
      console.warn("[Auth] Failed to write audit log to database:", auditErr.message);
    }

    // Keep store memory in sync
    store.auditLogs.unshift({
      id: store.auditLogs.length + 1,
      officer: user.name,
      action: auditAction,
      target: user.id,
      ip: req.ip || "127.0.0.1",
      date: "Just now",
      status: "success",
    });

    const token = `jwt-neon-${user.id}-${Date.now()}`;

    return res.json({
      success: true,
      token,
      source: "neon_database",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        title: user.title,
        department: user.department,
        nationalId: user.national_id,
        phone: user.phone,
        nationality: user.nationality,
        status: user.status,
        avatar: user.avatar || (user.name ? user.name.substring(0, 2).toUpperCase() : "U"),
      },
    });
  } catch (err) {
    console.error("[Auth API Error]:", err);
    return res.status(500).json({
      success: false,
      message: "Database authentication error: " + err.message,
    });
  }
});

// POST /api/auth/register - Citizen self-registration
router.post("/register", async (req, res) => {
  try {
    const {
      name = "",
      email = "",
      password = "",
      nationalId = "",
      phone = "",
      nationality = "",
    } = req.body;

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanNationalId = nationalId.trim();

    if (!cleanName || !cleanEmail || !password || !cleanNationalId) {
      return res.status(400).json({
        success: false,
        message: "Full name, email, national ID, and password are required.",
      });
    }

    if (!isDbAvailable()) {
      const exists = store.users.some(
        (user) =>
          user.email?.toLowerCase() === cleanEmail ||
          user.nationalId === cleanNationalId
      );

      if (exists) {
        return res.status(409).json({
          success: false,
          message: "A citizen account already exists for this email or national ID.",
        });
      }

      const user = {
        id: `usr-citizen-${Date.now()}`,
        name: cleanName,
        email: cleanEmail,
        password,
        role: "citizen",
        nationalId: cleanNationalId,
        phone: phone.trim() || null,
        nationality: nationality.trim() || null,
        status: "active",
        avatar: cleanName.substring(0, 2).toUpperCase(),
      };

      store.users.push(user);
      return res.status(201).json({
        success: true,
        token: `jwt-memory-${user.id}-${Date.now()}`,
        source: "memory_store",
        user,
      });
    }

    const existing = await query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER($1) OR national_id = $2 LIMIT 1",
      [cleanEmail, cleanNationalId]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "A citizen account already exists for this email or national ID.",
      });
    }

    const id = `usr-citizen-${Date.now()}`;
    const avatar = cleanName.substring(0, 2).toUpperCase();
    const result = await query(
      `INSERT INTO users (id, name, email, password, role, national_id, phone, nationality, status, avatar)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9)
       RETURNING *`,
      [
        id,
        cleanName,
        cleanEmail,
        password,
        "citizen",
        cleanNationalId,
        phone.trim() || null,
        nationality.trim() || null,
        avatar,
      ]
    );

    const user = result.rows[0];
    const nowStr = new Date().toLocaleString();

    try {
      await query(
        `INSERT INTO audit_logs (officer, action, target, ip, date, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          user.name,
          "Citizen Account Created",
          user.id,
          req.ip || "127.0.0.1",
          nowStr,
          "success",
        ]
      );
    } catch (auditErr) {
      console.warn("[Auth] Failed to write registration audit log:", auditErr.message);
    }

    return res.status(201).json({
      success: true,
      token: `jwt-neon-${user.id}-${Date.now()}`,
      source: "neon_database",
      user: toPublicUser(user),
    });
  } catch (err) {
    console.error("[Register API Error]:", err);
    return res.status(500).json({
      success: false,
      message: "Citizen registration error: " + err.message,
    });
  }
});

// GET /api/auth/me - Fetch user details from database
router.get("/me", async (req, res) => {
  try {
    const role = req.query.role || "citizen";

    if (!isDbAvailable()) {
      const user = store.users.find((u) => u.role === role);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      return res.json({ success: true, source: "memory_store", user });
    }

    const userRes = await query(
      `SELECT * FROM users WHERE role = $1 ORDER BY id ASC LIMIT 1`,
      [role]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = userRes.rows[0];
    res.json({
      success: true,
      source: "neon_database",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        title: user.title,
        department: user.department,
        nationalId: user.national_id,
        phone: user.phone,
        nationality: user.nationality,
        status: user.status,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
});

export default router;

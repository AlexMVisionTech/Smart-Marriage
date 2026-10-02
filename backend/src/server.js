import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.js";
import applicationsRoutes from "./routes/applications.routes.js";
import certificatesRoutes from "./routes/certificates.routes.js";
import documentsRoutes from "./routes/documents.routes.js";
import auditRoutes from "./routes/audit.routes.js";
import statsRoutes from "./routes/stats.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import usersRoutes from "./routes/users.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import paymentsRoutes from "./routes/payments.routes.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 5000);

// Middleware
app.use(cors({
  origin(origin, callback) {
    if (!origin || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true,
}));
// Base64 encoded 10 MB PDFs need roughly 13.4 MB before JSON overhead.
app.use(express.json({ limit: "16mb" }));
app.use(morgan("dev"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Smart Marriage Certificate System Backend API",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/certificates", certificatesRoutes);
app.use("/api/documents", documentsRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/payments", paymentsRoutes);

// Root informational endpoint
app.get("/", (req, res) => {
  res.json({
    name: "Smart Marriage Certificate System API",
    version: "1.0.0",
    docs: {
      health: "/api/health",
      auth: "/api/auth",
      applications: "/api/applications",
      certificates: "/api/certificates",
      documents: "/api/documents",
      audit: "/api/audit",
      stats: "/api/stats",
      ai: "/api/ai",
      users: "/api/users",
      notifications: "/api/notifications",
      settings: "/api/settings",
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.url}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("API Error:", err);
  res.status(500).json({ success: false, message: err.message || "Internal server error" });
});

import { initDb, setDbAvailable } from "./db.js";

const startServer = (port = PORT, attemptsRemaining = 5) => {
  const server = app.listen(port, () => {
    console.log(`[Smart Marriage Certificate System API] running on http://localhost:${port}`);
    console.log(`Health check: http://localhost:${port}/api/health`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE" && attemptsRemaining > 0) {
      const nextPort = port + 1;
      console.warn(`[Server] Port ${port} is already in use. Trying ${nextPort}...`);
      startServer(nextPort, attemptsRemaining - 1);
      return;
    }

    console.error(`[Server] Failed to start API: ${err.message}`);
    process.exit(1);
  });
};

initDb()
  .then(() => {
    startServer();
  })
  .catch((err) => {
    setDbAvailable(false);
    console.warn("[Database] PostgreSQL unavailable. Starting API with empty in-memory fallback data.");
    console.warn(`[Database] ${err.message}`);
    startServer();
  });

export default app;

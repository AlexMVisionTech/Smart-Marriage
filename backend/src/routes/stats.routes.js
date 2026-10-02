import { Router } from "express";
import { isDbAvailable, query } from "../db.js";
import { store } from "../data/store.js";

const router = Router();

router.get("/summary", async (req, res) => {
  try {
    if (!isDbAvailable()) {
      const counts = store.applications.reduce(
        (acc, app) => {
          acc.totalApplications += 1;
          if (app.status === "pending") acc.pendingApplications += 1;
          if (app.status === "review") acc.underReviewApplications += 1;
          if (app.status === "approved") acc.approvedCount += 1;
          if (app.status === "rejected") acc.rejectedCount += 1;
          return acc;
        },
        {
          pendingApplications: 0,
          underReviewApplications: 0,
          approvedCount: 0,
          rejectedCount: 0,
          totalApplications: 0,
        }
      );

      return res.json({ success: true, stats: { ...store.stats, ...counts } });
    }

    const result = await query("SELECT status, COUNT(*) FROM applications GROUP BY status");
    const certResult = await query("SELECT COUNT(*) FROM certificates");
    const officerResult = await query("SELECT COUNT(*) FROM users WHERE role = 'admin'");
    let pendingCount = 0, underReviewCount = 0, approvedCount = 0, rejectedCount = 0, total = 0;
    
    result.rows.forEach(r => {
      const cnt = parseInt(r.count, 10);
      total += cnt;
      if (r.status === 'pending') pendingCount = cnt;
      else if (r.status === 'review') underReviewCount = cnt;
      else if (r.status === 'approved') approvedCount = cnt;
      else if (r.status === 'rejected') rejectedCount = cnt;
    });

    const decided = approvedCount + rejectedCount;
    const approvalRatePercent = decided > 0 ? Math.round((approvedCount / decided) * 1000) / 10 : 0;

    res.json({
      success: true,
      stats: {
        pendingApplications: pendingCount,
        underReviewApplications: underReviewCount,
        approvedCount,
        rejectedCount,
        totalApplications: total,
        certificatesIssued: parseInt(certResult.rows[0].count, 10),
        avgProcessingTimeDays: 0,
        approvalRatePercent,
        activeOfficers: parseInt(officerResult.rows[0].count, 10),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/monthly", async (req, res) => {
  try {
    if (!isDbAvailable()) {
      return res.json({ success: true, monthly: store.stats.monthly });
    }

    const result = await query("SELECT status, submission_date, created_at FROM applications");
    const buckets = new Map();

    result.rows.forEach((row) => {
      const parsed = new Date(row.submission_date || row.created_at);
      if (Number.isNaN(parsed.getTime())) return;

      const key = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`;
      const label = parsed.toLocaleString("en-US", { month: "short" });
      const bucket = buckets.get(key) || { month: label, apps: 0, approved: 0, rejected: 0 };
      bucket.apps += 1;
      if (row.status === "approved") bucket.approved += 1;
      if (row.status === "rejected") bucket.rejected += 1;
      buckets.set(key, bucket);
    });

    const monthly = Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([, value]) => value);

    res.json({ success: true, monthly });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/distribution", async (req, res) => {
  try {
    if (!isDbAvailable()) {
      return res.json({ success: true, distribution: store.stats.statusDistribution });
    }

    const result = await query("SELECT status, COUNT(*) FROM applications GROUP BY status");
    const colors = {
      approved: "#059669",
      pending: "#d97706",
      review: "#2563eb",
      documents: "#ea580c",
      rejected: "#dc2626",
    };

    const distribution = result.rows.map((row) => ({
      name: row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : "Unknown",
      value: parseInt(row.count, 10),
      color: colors[row.status] || "#64748b",
    }));

    res.json({ success: true, distribution });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

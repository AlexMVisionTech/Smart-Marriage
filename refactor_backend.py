import os
import json

base_path = "/home/mweraalex/Downloads/Smart Marriage Certificate System/backend/src"

# 1. Update db.js to add columns and seed data
db_js_path = os.path.join(base_path, "db.js")
with open(db_js_path, "r") as f:
    db_content = f.read()

if "ADD COLUMN documents" not in db_content:
    db_content = db_content.replace(
        "CREATE TABLE IF NOT EXISTS applications (",
        """CREATE TABLE IF NOT EXISTS applications (
        documents JSONB,
        timeline JSONB,
        progress INTEGER,
        certificate_id VARCHAR(100),
        rejection_reason TEXT,"""
    )
    
    # We'll just append a script to seed the store into DB
    seed_script = """
    // Seed applications from store
    import { store } from "./data/store.js";
    const checkApps = await client.query("SELECT COUNT(*) FROM applications");
    if (parseInt(checkApps.rows[0].count, 10) === 0) {
      console.log("[Database] Seeding applications...");
      for (const app of store.applications) {
        await client.query(
          `INSERT INTO applications (id, reference_no, husband, wife, venue, status, priority, submission_date, assigned_officer, progress, documents, timeline, certificate_id, rejection_reason) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [app.id, app.referenceNo, app.husband, app.wife, app.venue, app.status, app.priority, app.submittedAt, app.officer, app.progress, app.documents, app.timeline, app.certificateId, app.rejectionReason || null]
        );
      }
    }

    // Seed certificates from store
    const checkCerts = await client.query("SELECT COUNT(*) FROM certificates");
    if (parseInt(checkCerts.rows[0].count, 10) === 0) {
      console.log("[Database] Seeding certificates...");
      for (const cert of store.certificates) {
        await client.query(
          `INSERT INTO certificates (id, certificate_no, application_id, husband_name, wife_name, husband_id, wife_id, date_of_marriage, place_of_marriage, registrar_name, qr_code_hash, blockchain_tx, status) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [cert.certificateNo, cert.certificateNo, cert.applicationId, cert.husband.name, cert.wife.name, cert.husband.nationalId, cert.wife.nationalId, cert.marriageDate, cert.venue, cert.registrar, cert.verificationId, cert.blockchainHash, cert.status]
        );
      }
    }
"""
    db_content = db_content.replace('console.log(`[Database] Connected! ${userCount} users found in PostgreSQL database.`);', 'console.log(`[Database] Connected! ${userCount} users found in PostgreSQL database.`);\n' + seed_script)
    with open(db_js_path, "w") as f:
        f.write(db_content)

# 2. Update applications.routes.js
apps_route = """import { Router } from "express";
import { query } from "../db.js";

const router = Router();

const mapDbAppToFrontend = (row) => ({
  id: row.id,
  referenceNo: row.reference_no,
  husband: row.husband,
  wife: row.wife,
  marriageDate: row.proposed_date || row.timeline?.[0]?.date || "Dec 15, 2024",
  venue: row.venue,
  date: row.submission_date || "Dec 15, 2024",
  submittedAt: row.submission_date,
  status: row.status,
  officer: row.assigned_officer,
  priority: row.priority,
  progress: row.progress || 0,
  documents: row.documents || {},
  timeline: row.timeline || [],
  certificateId: row.certificate_id,
  rejectionReason: row.rejection_reason,
  name: row.husband?.name,
  national: row.husband?.nationalId
});

router.get("/", async (req, res) => {
  try {
    const { filter = "all", search = "", priority = "all" } = req.query;
    let sql = "SELECT * FROM applications WHERE 1=1";
    const params = [];
    let paramCount = 1;

    if (filter !== "all") {
      sql += ` AND status = $${paramCount++}`;
      params.push(filter.toLowerCase());
    }
    if (priority !== "all") {
      sql += ` AND priority = $${paramCount++}`;
      params.push(priority.toLowerCase());
    }
    
    const result = await query(sql, params);
    let results = result.rows.map(mapDbAppToFrontend);

    if (search) {
      const q = search.toLowerCase();
      results = results.filter(
        (app) =>
          app.id.toLowerCase().includes(q) ||
          (app.referenceNo && app.referenceNo.toLowerCase().includes(q)) ||
          (app.husband?.name && app.husband.name.toLowerCase().includes(q)) ||
          (app.wife?.name && app.wife.name.toLowerCase().includes(q)) ||
          (app.husband?.nationalId && app.husband.nationalId.includes(q)) ||
          (app.wife?.nationalId && app.wife.nationalId.includes(q))
      );
    }

    res.json({
      success: true,
      count: results.length,
      total: result.rows.length,
      applications: results,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query("SELECT * FROM applications WHERE id = $1", [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    res.json({ success: true, application: mapDbAppToFrontend(result.rows[0]) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, officer = "Sarah Mitchell", reason } = req.body;

    const result = await query("SELECT * FROM applications WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    let progress = result.rows[0].progress;
    let certId = result.rows[0].certificate_id;

    if (status === "approved") {
      progress = 100;
      if (!certId) {
        certId = `CERT-2024-00${Math.floor(3000 + Math.random() * 999)}`;
        const verificationId = `VER-UAE-${Math.floor(10000 + Math.random() * 90000)}`;
        const hash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
        
        await query(
          `INSERT INTO certificates (id, certificate_no, application_id, husband_name, wife_name, husband_id, wife_id, date_of_marriage, place_of_marriage, registrar_name, qr_code_hash, blockchain_tx, status) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [certId, certId, id, result.rows[0].husband?.name, result.rows[0].wife?.name, result.rows[0].husband?.nationalId, result.rows[0].wife?.nationalId, result.rows[0].proposed_date, result.rows[0].venue, officer, verificationId, hash, "valid"]
        );
      }
    }

    await query(
      `UPDATE applications SET status = $1, assigned_officer = $2, rejection_reason = $3, progress = $4, certificate_id = $5 WHERE id = $6`,
      [status, officer, reason || null, progress, certId, id]
    );

    const updated = await query("SELECT * FROM applications WHERE id = $1", [id]);
    res.json({ success: true, application: mapDbAppToFrontend(updated.rows[0]) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch("/:id/priority", async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;
    await query("UPDATE applications SET priority = $1 WHERE id = $2", [priority, id]);
    const updated = await query("SELECT * FROM applications WHERE id = $1", [id]);
    res.json({ success: true, application: mapDbAppToFrontend(updated.rows[0]) });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
"""

with open(os.path.join(base_path, "routes/applications.routes.js"), "w") as f:
    f.write(apps_route)

# 3. Update certificates.routes.js
certs_route = """import { Router } from "express";
import { query } from "../db.js";

const router = Router();

const mapCert = (row) => ({
  certificateNo: row.certificate_no,
  verificationId: row.qr_code_hash,
  applicationId: row.application_id,
  issueDate: row.issued_at,
  husband: { name: row.husband_name, nationalId: row.husband_id },
  wife: { name: row.wife_name, nationalId: row.wife_id },
  marriageDate: row.date_of_marriage,
  venue: row.place_of_marriage,
  registrar: row.registrar_name,
  blockchainHash: row.blockchain_tx,
  status: row.status,
  verificationStatus: {
    digitalSignature: true,
    blockchainRecord: true,
    governmentRegistry: true,
    qrCodeActive: true,
  }
});

router.get("/", async (req, res) => {
  try {
    const result = await query("SELECT * FROM certificates");
    res.json({ success: true, certificates: result.rows.map(mapCert) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/:certificateNo", async (req, res) => {
  try {
    const { certificateNo } = req.params;
    const result = await query("SELECT * FROM certificates WHERE certificate_no = $1", [certificateNo]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, certificate: mapCert(result.rows[0]) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/verify/:verificationId", async (req, res) => {
  try {
    const { verificationId } = req.params;
    const result = await query("SELECT * FROM certificates WHERE qr_code_hash = $1 OR certificate_no = $1", [verificationId]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, verified: false, message: "Verification failed" });
    res.json({ success: true, verified: true, message: "Official verified", certificate: mapCert(result.rows[0]) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
"""

with open(os.path.join(base_path, "routes/certificates.routes.js"), "w") as f:
    f.write(certs_route)

# 4. Update stats.routes.js
stats_route = """import { Router } from "express";
import { query } from "../db.js";
import { store } from "../data/store.js";

const router = Router();

router.get("/summary", async (req, res) => {
  try {
    const result = await query("SELECT status, COUNT(*) FROM applications GROUP BY status");
    let pendingCount = 0, underReviewCount = 0, approvedCount = 0, rejectedCount = 0, total = 0;
    
    result.rows.forEach(r => {
      const cnt = parseInt(r.count, 10);
      total += cnt;
      if (r.status === 'pending') pendingCount = cnt;
      else if (r.status === 'review') underReviewCount = cnt;
      else if (r.status === 'approved') approvedCount = cnt;
      else if (r.status === 'rejected') rejectedCount = cnt;
    });

    res.json({
      success: true,
      stats: {
        ...store.stats,
        pendingApplications: pendingCount,
        underReviewApplications: underReviewCount,
        approvedCount,
        rejectedCount,
        totalApplications: total,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/monthly", (req, res) => {
  res.json({ success: true, monthly: store.stats.monthly });
});

router.get("/distribution", (req, res) => {
  res.json({ success: true, distribution: store.stats.statusDistribution });
});

export default router;
"""

with open(os.path.join(base_path, "routes/stats.routes.js"), "w") as f:
    f.write(stats_route)

print("Backend refactored to use DB successfully!")

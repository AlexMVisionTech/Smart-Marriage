import { Router } from "express";
import { isDbAvailable, query } from "../db.js";
import { store } from "../data/store.js";

const router = Router();

const addNotification = async ({ userId, type, title, message }) => {
  if (isDbAvailable()) {
    await query(
      "INSERT INTO notifications (user_id, type, title, message) VALUES ($1, $2, $3, $4)",
      [userId || null, type, title, message]
    );
    return;
  }

  store.notifications.unshift({
    id: Date.now(), userId: userId || null, type, title, message, read: false,
    time: new Date().toISOString(),
  });
};

const applicantUserId = async (husband = {}, wife = {}) => {
  const email = husband.email || wife.email;
  const nationalId = husband.nationalId || wife.nationalId;
  if (isDbAvailable()) {
    const result = await query(
      "SELECT id FROM users WHERE ($1::text IS NOT NULL AND email = $1) OR ($2::text IS NOT NULL AND national_id = $2) LIMIT 1",
      [email || null, nationalId || null]
    );
    return result.rows[0]?.id || null;
  }
  return store.users.find((user) =>
    (email && user.email === email) || (nationalId && user.nationalId === nationalId)
  )?.id || null;
};

const mapDbAppToFrontend = (row) => ({
  id: row.id,
  referenceNo: row.reference_no,
  husband: row.husband,
  wife: row.wife,
  marriageDate: row.proposed_date || row.timeline?.[0]?.date || "",
  venue: row.venue,
  date: row.submission_date || "",
  submittedAt: row.submission_date,
  status: row.status,
  officer: row.assigned_officer,
  priority: row.priority,
  progress: row.progress || 0,
  documents: row.documents || {},
  timeline: row.timeline || [],
  certificateId: row.certificate_id,
  rejectionReason: row.rejection_reason,
  paymentStatus: row.payment_status || "unpaid",
  paymentAmount: row.payment_amount || null,
  name: row.husband?.name,
  national: row.husband?.nationalId
});

router.get("/", async (req, res) => {
  try {
    const { filter = "all", search = "", priority = "all", nationalId = "" } = req.query;

    if (!isDbAvailable()) {
      let results = [...store.applications];
      if (filter !== "all") {
        results = results.filter((app) => app.status === filter);
      }
      if (priority !== "all") {
        results = results.filter((app) => app.priority === priority);
      }
      if (nationalId) {
        results = results.filter(
          (app) =>
            app.husband?.nationalId === nationalId ||
            app.wife?.nationalId === nationalId
        );
      }
      if (search) {
        const q = search.toLowerCase();
        results = results.filter(
          (app) =>
            app.id.toLowerCase().includes(q) ||
            app.referenceNo?.toLowerCase().includes(q) ||
            app.husband?.name?.toLowerCase().includes(q) ||
            app.wife?.name?.toLowerCase().includes(q) ||
            app.husband?.nationalId?.includes(q) ||
            app.wife?.nationalId?.includes(q)
        );
      }

      return res.json({
        success: true,
        count: results.length,
        total: store.applications.length,
        applications: results,
      });
    }

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
    if (nationalId) {
      sql += ` AND (husband->>'nationalId' = $${paramCount} OR wife->>'nationalId' = $${paramCount})`;
      params.push(nationalId);
      paramCount += 1;
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

    if (!isDbAvailable()) {
      const application = store.applications.find((app) => app.id === id);
      if (!application) {
        return res.status(404).json({ success: false, message: "Application not found" });
      }
      return res.json({ success: true, application });
    }

    const result = await query("SELECT * FROM applications WHERE id = $1", [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    res.json({ success: true, application: mapDbAppToFrontend(result.rows[0]) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const data = req.body || {};
    const now = new Date();
    const year = now.getFullYear();
    const suffix = String(Math.floor(100000 + Math.random() * 900000));
    const id = data.id || `MC-${year}-${suffix}`;
    const referenceNo = data.referenceNo || `REF-KE-${suffix}`;
    const husband = data.husband || {};
    const wife = data.wife || {};

    const applicantIds = [husband.nationalId, wife.nationalId].filter(Boolean);
    if (applicantIds.length) {
      let existingApplication;
      if (isDbAvailable()) {
        const existing = await query(
          `SELECT * FROM applications
           WHERE husband->>'nationalId' = ANY($1::text[])
              OR wife->>'nationalId' = ANY($1::text[])
           ORDER BY created_at DESC LIMIT 1`,
          [applicantIds]
        );
        existingApplication = existing.rows[0] ? mapDbAppToFrontend(existing.rows[0]) : null;
      } else {
        existingApplication = store.applications.find((app) =>
          applicantIds.some((nationalId) =>
            app.husband?.nationalId === nationalId || app.wife?.nationalId === nationalId
          )
        ) || null;
      }
      if (existingApplication) {
        return res.status(409).json({
          success: false,
          message: "An application has already been submitted using one of these national ID numbers.",
          application: existingApplication,
        });
      }
    }

    const documents = data.documents || {
      national_id: { uploaded: false, status: "missing", name: null },
      passport: { uploaded: false, status: "missing", name: null },
      birth_cert: { uploaded: false, status: "missing", name: null },
      medical_screening: { uploaded: false, status: "missing", name: null },
      photos: { uploaded: false, status: "missing", name: null },
      consent: { uploaded: false, status: "optional", name: null },
    };
    const timeline = [
      {
        label: "Application Draft Submitted",
        detail: "Online application details received.",
        date: now.toLocaleString(),
        done: true,
      },
    ];

    const application = {
      id,
      referenceNo,
      husband,
      wife,
      marriageDate: data.marriageDate || data.proposedDate || "",
      venue: data.venue || data.registrationOffice || "",
      county: data.county || "",
      date: now.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      submittedAt: now.toISOString(),
      status: "documents",
      paymentStatus: "unpaid",
      paymentDemo: false,
      paymentAmount: Number(process.env.APPLICATION_FEE_KES || 0),
      officer: null,
      priority: "normal",
      progress: 20,
      documents,
      timeline,
      name: husband.name,
      national: husband.nationalId,
    };

    if (!isDbAvailable()) {
      store.applications.unshift(application);
      const userId = await applicantUserId(husband, wife);
      await addNotification({
        userId,
        type: "info",
        title: "Application submitted",
        message: `Your application ${id} has been submitted. Track your progress in the Application Tracker.`,
      });
      return res.status(201).json({ success: true, application });
    }

    await query(
      `INSERT INTO applications (id, reference_no, husband, wife, marriage_type, proposed_date, venue, county, status, priority, submission_date, assigned_officer, progress, documents, timeline)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        id,
        referenceNo,
        JSON.stringify(husband),
        JSON.stringify(wife),
        data.marriageType || data.ceremonyType || null,
        application.marriageDate,
        application.venue,
        application.county,
        application.status,
        application.priority,
        application.submittedAt,
        application.officer,
        application.progress,
        JSON.stringify(documents),
        JSON.stringify(timeline),
      ]
    );

    const created = await query("SELECT * FROM applications WHERE id = $1", [id]);
    const userId = await applicantUserId(husband, wife);
    await addNotification({
      userId,
      type: "info",
      title: "Application submitted",
      message: `Your application ${id} has been submitted. Track your progress in the Application Tracker.`,
    });
    res.status(201).json({ success: true, application: mapDbAppToFrontend(created.rows[0]) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/:id/submit", async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentReceipt } = req.body || {};
    if (!paymentReceipt) return res.status(400).json({ success: false, message: "A confirmed M-Pesa receipt is required." });
    if (!isDbAvailable()) {
      const application = store.applications.find((item) => item.id === id);
      if (!application) return res.status(404).json({ success: false, message: "Application not found" });
      if (application.paymentStatus !== "paid" || application.paymentReceipt !== paymentReceipt) return res.status(402).json({ success: false, message: "Payment has not been confirmed." });
      application.status = "review";
      application.timeline = [...(application.timeline || []), { label: "Submitted for review", detail: "Payment confirmed and application submitted.", date: new Date().toLocaleString(), done: true }];
      return res.json({ success: true, application });
    }
    const result = await query("SELECT * FROM applications WHERE id = $1", [id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: "Application not found" });
    const current = result.rows[0];
    if (current.payment_status !== "paid" || current.payment_receipt !== paymentReceipt) return res.status(402).json({ success: false, message: "Payment has not been confirmed." });
    const timeline = [...(current.timeline || []), { label: "Submitted for review", detail: "Payment confirmed and application submitted.", date: new Date().toLocaleString(), done: true }];
    await query("UPDATE applications SET status = 'review', timeline = $1 WHERE id = $2", [JSON.stringify(timeline), id]);
    const updated = await query("SELECT * FROM applications WHERE id = $1", [id]);
    res.json({ success: true, application: mapDbAppToFrontend(updated.rows[0])});
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, officer, reason } = req.body;

    if (!isDbAvailable()) {
      const application = store.applications.find((app) => app.id === id);
      if (!application) {
        return res.status(404).json({ success: false, message: "Application not found" });
      }

      application.status = status;
      application.officer = officer || application.officer || null;
      application.rejectionReason = reason || null;
      if (status === "approved") {
        application.progress = 100;
        application.certificateId = application.certificateId || `CERT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
        if (!store.certificates.some((certificate) => certificate.applicationId === id)) {
          const verificationId = `VER-KE-${Math.floor(10000 + Math.random() * 90000)}`;
          const blockchainHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
          store.certificates.unshift({
            certificateNo: application.certificateId,
            verificationId,
            blockchainHash,
            applicationId: id,
            issueDate: new Date().toISOString(),
            husband: { ...application.husband },
            wife: { ...application.wife },
            marriageDate: application.marriageDate,
            venue: application.venue,
            registrar: application.officer || "Registrar",
            status: "valid",
          });
        }
      }

      const userId = await applicantUserId(application.husband, application.wife);
      if (status === "approved") {
        application.timeline = [...(application.timeline || []), {
          label: "Approved",
          detail: "Your application has been approved. Your certificate is ready to check in the Certificate Vault.",
          date: new Date().toLocaleString(),
          done: true,
        }];
        await addNotification({
          userId,
          type: "success",
          title: "Application approved",
          message: `Your application ${id} has been approved. Check your certificate in the Certificate Vault.`,
        });
      }
      if (status === "rejected") {
        await addNotification({
          userId,
          type: "warning",
          title: "Application update",
          message: `A decision has been made on application ${id}.${reason ? ` Registrar note: ${reason}` : " Please review your application tracker."}`,
        });
      }

      return res.json({ success: true, application });
    }

    const result = await query("SELECT * FROM applications WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    let progress = result.rows[0].progress;
    let certId = result.rows[0].certificate_id;
    const assignedOfficer = officer || result.rows[0].assigned_officer || null;

    if (status === "approved") {
      progress = 100;
      if (!certId) {
        certId = `CERT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
        const verificationId = `VER-KE-${Math.floor(10000 + Math.random() * 90000)}`;
        const hash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
        
        await query(
          `INSERT INTO certificates (id, certificate_no, application_id, husband_name, wife_name, husband_id, wife_id, date_of_marriage, place_of_marriage, registrar_name, qr_code_hash, blockchain_tx, status, husband_dob, husband_birth_place, husband_nationality, wife_dob, wife_birth_place, wife_nationality)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
          [certId, certId, id, result.rows[0].husband?.name, result.rows[0].wife?.name, result.rows[0].husband?.nationalId, result.rows[0].wife?.nationalId, result.rows[0].proposed_date, result.rows[0].venue, assignedOfficer, verificationId, hash, "valid", result.rows[0].husband?.dob, result.rows[0].husband?.birthPlace, result.rows[0].husband?.nationality, result.rows[0].wife?.dob, result.rows[0].wife?.birthPlace, result.rows[0].wife?.nationality]
        );
      }
    }

    let timeline = result.rows[0].timeline || [];
    if (status === "approved") {
      timeline = [...timeline, {
        label: "Approved",
        detail: "Your application has been approved. Your certificate is ready to check in the Certificate Vault.",
        date: new Date().toLocaleString(),
        done: true,
      }];
    }
    await query(
      `UPDATE applications SET status = $1, assigned_officer = $2, rejection_reason = $3, progress = $4, certificate_id = $5, timeline = $6 WHERE id = $7`,
      [status, assignedOfficer, reason || null, progress, certId, JSON.stringify(timeline), id]
    );

    const updated = await query("SELECT * FROM applications WHERE id = $1", [id]);
    const userId = await applicantUserId(result.rows[0].husband || {}, result.rows[0].wife || {});
    if (status === "approved") {
      await addNotification({
        userId,
        type: "success",
        title: "Application approved",
        message: `Your application ${id} has been approved. Check your certificate in the Certificate Vault.`,
      });
    } else if (status === "rejected") {
      await addNotification({
        userId,
        type: "warning",
        title: "Application update",
        message: `A decision has been made on application ${id}.${reason ? ` Registrar note: ${reason}` : " Please review your application tracker."}`,
      });
    }
    res.json({ success: true, application: mapDbAppToFrontend(updated.rows[0]) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch("/:id/priority", async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    if (!isDbAvailable()) {
      const application = store.applications.find((app) => app.id === id);
      if (!application) {
        return res.status(404).json({ success: false, message: "Application not found" });
      }
      application.priority = priority;
      return res.json({ success: true, application });
    }

    await query("UPDATE applications SET priority = $1 WHERE id = $2", [priority, id]);
    const updated = await query("SELECT * FROM applications WHERE id = $1", [id]);
    res.json({ success: true, application: mapDbAppToFrontend(updated.rows[0]) });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

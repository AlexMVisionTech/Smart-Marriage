import { Router } from "express";
import { isDbAvailable, query } from "../db.js";

const router = Router();
const requiredDocuments = ["national_id", "passport", "birth_cert", "medical_screening", "photos"];

const documentState = (documents = {}, key) => {
  const applicantOne = documents[`${key}_applicantOne`];
  const applicantTwo = documents[`${key}_applicantTwo`];
  if (applicantOne || applicantTwo) {
    const records = [applicantOne, applicantTwo];
    if (records.some((record) => record?.status === "flagged")) return "flagged";
    return records.every((record) => record?.uploaded) ? "uploaded" : "missing";
  }
  const legacyRecord = documents[key];
  if (legacyRecord?.status === "flagged") return "flagged";
  return legacyRecord?.uploaded ? "uploaded" : "missing";
};

// Replies are computed exclusively from PostgreSQL records; this endpoint does not use demo or in-memory data.
router.post("/chat", async (req, res) => {
  const message = String(req.body?.message || "").trim();
  const q = message.toLowerCase();

  if (!isDbAvailable()) {
    return res.status(503).json({ success: false, message: "The registry database is unavailable. No answer was generated." });
  }

  try {
    const [appsResult, certResult, officerResult] = await Promise.all([
      query(`SELECT id, reference_no, status, husband, wife, documents, priority, proposed_date, venue, county, submission_date, assigned_officer
             FROM applications ORDER BY created_at DESC`),
      query("SELECT COUNT(*) FROM certificates"),
      query("SELECT COUNT(*) FROM users WHERE role = 'admin'"),
    ]);
    const applications = appsResult.rows;
    const certificateCount = Number(certResult.rows[0].count);
    const officerCount = Number(officerResult.rows[0].count);
    let reply;

    const applicationRef = message.match(/\b(?:MC-\d{4}-\d+|REF-KE-\d+)\b/i)?.[0]?.toLowerCase();
    const nationalId = message.match(/\b\d{7,12}\b/)?.[0];
    const requestedApplication = applicationRef
      ? applications.find((app) => app.id?.toLowerCase() === applicationRef || app.reference_no?.toLowerCase() === applicationRef)
      : nationalId
        ? applications.find((app) => [app.husband?.nationalId, app.wife?.nationalId].includes(nationalId))
        : null;

    if (requestedApplication) {
      const app = requestedApplication;
      const missing = requiredDocuments.filter((key) => documentState(app.documents || {}, key) !== "uploaded");
      reply = [
        `Database record ${app.id}${app.reference_no ? ` (${app.reference_no})` : ""}.`,
        `Status: ${app.status || "not recorded"}; priority: ${app.priority || "not recorded"}.`,
        `Applicants: ${app.husband?.name || "not recorded"} and ${app.wife?.name || "not recorded"}.`,
        `County: ${app.county || "not recorded"}; proposed date: ${app.proposed_date || "not recorded"}.`,
        `Required document categories not fully uploaded: ${missing.length ? missing.join(", ") : "none"}.`,
        `Assigned officer: ${app.assigned_officer || "not assigned"}.`,
      ].join(" ");
    } else if (applicationRef || nationalId) {
      reply = "No matching application was found in the registry database.";
    } else if (q.includes("draft") || q.includes("decision note")) {
      reply = "To prepare a record-based decision note, include the application ID, reference number, or an applicant's National ID so I can retrieve the matching database record.";
    } else if (q.includes("document") || q.includes("missing") || q.includes("ocr")) {
      const issues = applications
        .map((app) => ({ app, missing: requiredDocuments.filter((key) => documentState(app.documents || {}, key) !== "uploaded") }))
        .filter(({ missing }) => missing.length > 0);
      const flaggedCount = applications.filter((app) =>
        Object.values(app.documents || {}).some((document) => document?.status === "flagged")
      ).length;
      const examples = issues.slice(0, 8).map(({ app, missing }) => `${app.id}: ${missing.join(", ")}`).join("; ");
      reply = `Database records show ${issues.length} application(s) with required document categories not fully uploaded and ${flaggedCount} application(s) with flagged documents.${examples ? ` Records: ${examples}${issues.length > 8 ? "; additional records omitted" : ""}.` : ""}`;
    } else if (q.includes("review") || q.includes("pending") || q.includes("application") || q.includes("priority")) {
      const pending = applications.filter((app) => !["approved", "rejected"].includes((app.status || "").toLowerCase()));
      const urgent = pending.filter((app) => (app.priority || "").toLowerCase() === "urgent");
      const latest = pending[0];
      reply = `Database records show ${pending.length} application(s) not yet approved or rejected, including ${urgent.length} urgent case(s).${latest ? ` Most recent: ${latest.id}, status ${latest.status || "not recorded"}, priority ${latest.priority || "not recorded"}.` : ""}`;
    } else if (q.includes("certificate") || q.includes("blockchain") || q.includes("verify")) {
      reply = `The registry database contains ${certificateCount} certificate record(s).`;
    } else if (q.includes("stat") || q.includes("report") || q.includes("kpi")) {
      const counts = applications.reduce((result, app) => {
        const status = (app.status || "unknown").toLowerCase();
        result[status] = (result[status] || 0) + 1;
        return result;
      }, {});
      const summary = Object.entries(counts).map(([status, count]) => `${status}: ${count}`).join(", ") || "no status records";
      reply = `Registry database totals: ${applications.length} application(s), ${certificateCount} certificate(s), and ${officerCount} registrar account(s). Application statuses: ${summary}.`;
    } else {
      reply = "I can answer questions about application status, required documents, certificates, and registry totals using records in the database. Include an application ID, reference number, or National ID to look up a specific case.";
    }

    res.json({ success: true, reply, source: "registry_database", timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ success: false, message: "The registry database query failed. No answer was generated." });
  }
});

export default router;

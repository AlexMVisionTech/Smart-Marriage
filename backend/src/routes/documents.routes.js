import { Router } from "express";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { store } from "../data/store.js";
import { isDbAvailable, query } from "../db.js";

const router = Router();
const uploadsDir = path.resolve(process.cwd(), "uploads");

const persistDocument = async ({ applicationId, documentType, fileName, mimeType, fileData }) => {
  if (path.extname(fileName).toLowerCase() !== ".pdf" || !["application/pdf", "application/octet-stream", ""].includes(mimeType)) {
    throw new Error("Only PDF files are accepted.");
  }
  const base64Data = fileData.split(",")[1] || "";
  const buffer = Buffer.from(base64Data, "base64");
  if (buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error("The selected file is not a valid PDF.");
  }
  if (!buffer.length || buffer.length > 10 * 1024 * 1024) {
    throw new Error("Document must be no larger than 10 MB.");
  }
  await mkdir(uploadsDir, { recursive: true });
  const safeApplicationId = applicationId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const safeType = documentType.replace(/[^a-zA-Z0-9_-]/g, "_");
  const extension = path.extname(fileName).slice(0, 12);
  const storedName = `${safeApplicationId}-${safeType}-${randomUUID()}${extension}`;
  await writeFile(path.join(uploadsDir, storedName), buffer, { flag: "wx" });
  return { storedName, size: buffer.length };
};

// GET /api/documents/:applicationId - Get documents status
router.get("/:applicationId", async (req, res) => {
  const { applicationId } = req.params;
  if (isDbAvailable()) {
    const result = await query("SELECT documents FROM applications WHERE id = $1", [applicationId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }
    return res.json({ success: true, documents: result.rows[0].documents || {} });
  }

  const app = store.applications.find((a) => a.id === applicationId);

  if (!app) {
    return res.status(404).json({ success: false, message: "Application not found" });
  }

  res.json({ success: true, documents: app.documents });
});

router.get("/:applicationId/:documentType/file", async (req, res) => {
  const { applicationId, documentType } = req.params;
  let documents;
  if (isDbAvailable()) {
    const result = await query("SELECT documents FROM applications WHERE id = $1", [applicationId]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: "Application not found" });
    documents = result.rows[0].documents || {};
  } else {
    const application = store.applications.find((item) => item.id === applicationId);
    if (!application) return res.status(404).json({ success: false, message: "Application not found" });
    documents = application.documents || {};
  }
  const document = documents[documentType];
  if (!document?.storedName) return res.status(404).json({ success: false, message: "Uploaded file not found" });
  res.type(document.mimeType || "application/octet-stream");
  res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(document.name || "document")}`);
  res.sendFile(document.storedName, { root: uploadsDir }, (err) => {
    if (err && !res.headersSent) res.status(err.statusCode || 404).json({ success: false, message: "Uploaded file not found" });
  });
});

// POST /api/documents/:applicationId/upload - Upload or update a document
router.post("/:applicationId/upload", async (req, res) => {
  const { applicationId } = req.params;
  const { documentType, fileName = "document.pdf", mimeType = "application/octet-stream", fileData } = req.body;

  if (!documentType || !fileData || typeof fileData !== "string" || !fileData.startsWith("data:")) {
    return res.status(400).json({ success: false, message: "Select a document file to upload." });
  }
  let persistedFile;
  try {
    persistedFile = await persistDocument({ applicationId, documentType, fileName, mimeType, fileData });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }

  if (isDbAvailable()) {
    const result = await query("SELECT documents FROM applications WHERE id = $1", [applicationId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }
    const documents = result.rows[0].documents || {};
    documents[documentType] = {
      uploaded: true,
      status: "processing",
      name: fileName,
      mimeType,
      storedName: persistedFile.storedName,
      size: persistedFile.size,
      uploadedAt: new Date().toISOString(),
    };
    await query("UPDATE applications SET documents = $1 WHERE id = $2", [
      JSON.stringify(documents),
      applicationId,
    ]);
    return res.json({
      success: true,
      message: `${documentType} successfully uploaded.`,
      documents,
    });
  }

  const app = store.applications.find((a) => a.id === applicationId);
  if (!app) {
    return res.status(404).json({ success: false, message: "Application not found" });
  }

  if (!app.documents[documentType]) {
    app.documents[documentType] = {};
  }

  app.documents[documentType] = {
    uploaded: true,
      status: "processing",
      name: fileName,
      mimeType,
      storedName: persistedFile.storedName,
      size: persistedFile.size,
      uploadedAt: new Date().toISOString(),
  };

  // Add audit entry
  store.auditLogs.unshift({
    id: store.auditLogs.length + 1,
    officer: "Registry Service",
    action: `Document uploaded (${documentType})`,
    target: applicationId,
    ip: req.ip || "127.0.0.1",
    date: "Just now",
    status: "success",
  });

  res.json({
    success: true,
    message: `${documentType} successfully uploaded.`,
    documents: app.documents,
  });
});

// DELETE /api/documents/:applicationId/:documentType - Remove document
router.delete("/:applicationId/:documentType", async (req, res) => {
  const { applicationId, documentType } = req.params;
  if (isDbAvailable()) {
    const result = await query("SELECT documents FROM applications WHERE id = $1", [applicationId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }
    const documents = result.rows[0].documents || {};
    if (!documents[documentType]) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }
    if (documents[documentType].storedName) {
      await unlink(path.join(uploadsDir, path.basename(documents[documentType].storedName))).catch(() => {});
    }
    documents[documentType] = {
      uploaded: false,
      status: "missing",
      name: null,
    };
    await query("UPDATE applications SET documents = $1 WHERE id = $2", [
      JSON.stringify(documents),
      applicationId,
    ]);
    return res.json({ success: true, message: "Document removed", documents });
  }

  const app = store.applications.find((a) => a.id === applicationId);

  if (!app || !app.documents[documentType]) {
    return res.status(404).json({ success: false, message: "Document not found" });
  }

  if (app.documents[documentType].storedName) {
    await unlink(path.join(uploadsDir, path.basename(app.documents[documentType].storedName))).catch(() => {});
  }

  app.documents[documentType] = {
    uploaded: false,
    status: "missing",
    name: null,
  };

  res.json({ success: true, message: "Document removed", documents: app.documents });
});

export default router;

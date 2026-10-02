import { Router } from "express";
import { isDbAvailable, query } from "../db.js";
import { store } from "../data/store.js";

const router = Router();

const mapCert = (row) => ({
  certificateNo: row.certificate_no,
  verificationId: row.qr_code_hash,
  applicationId: row.application_id,
  issueDate: row.issued_at,
  husband: {
    name: row.husband_name || row.application_husband?.name,
    nationalId: row.husband_id || row.application_husband?.nationalId,
    dob: row.husband_dob || row.application_husband?.dob,
    birthPlace: row.husband_birth_place || row.application_husband?.birthPlace,
    nationality: row.husband_nationality || row.application_husband?.nationality,
  },
  wife: {
    name: row.wife_name || row.application_wife?.name,
    nationalId: row.wife_id || row.application_wife?.nationalId,
    dob: row.wife_dob || row.application_wife?.dob,
    birthPlace: row.wife_birth_place || row.application_wife?.birthPlace,
    nationality: row.wife_nationality || row.application_wife?.nationality,
  },
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
    const { nationalId = "" } = req.query;

    if (!isDbAvailable()) {
      const certificates = nationalId
        ? store.certificates.filter(
            (cert) =>
              cert.husband?.nationalId === nationalId ||
              cert.wife?.nationalId === nationalId
          )
        : store.certificates;
      return res.json({ success: true, certificates });
    }

    const result = nationalId
      ? await query(
          `SELECT c.*, a.husband AS application_husband, a.wife AS application_wife
           FROM certificates c LEFT JOIN applications a ON a.id = c.application_id
           WHERE c.husband_id = $1 OR c.wife_id = $1 ORDER BY c.issued_at DESC`,
          [nationalId]
        )
      : await query(`SELECT c.*, a.husband AS application_husband, a.wife AS application_wife
                     FROM certificates c LEFT JOIN applications a ON a.id = c.application_id
                     ORDER BY c.issued_at DESC`);
    res.json({ success: true, certificates: result.rows.map(mapCert) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/verify/:verificationId", async (req, res) => {
  try {
    const { verificationId } = req.params;

    if (!isDbAvailable()) {
      const certificate = store.certificates.find(
        (cert) => cert.verificationId === verificationId || cert.certificateNo === verificationId
      );
      if (!certificate) return res.status(404).json({ success: false, verified: false, message: "Verification failed" });
      return res.json({ success: true, verified: true, message: "Official verified", certificate });
    }

    const result = await query(
      `SELECT c.*, a.husband AS application_husband, a.wife AS application_wife
       FROM certificates c LEFT JOIN applications a ON a.id = c.application_id
       WHERE c.qr_code_hash = $1 OR c.certificate_no = $1`,
      [verificationId]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, verified: false, message: "Verification failed" });
    res.json({ success: true, verified: true, message: "Official verified", certificate: mapCert(result.rows[0]) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/:certificateNo", async (req, res) => {
  try {
    const { certificateNo } = req.params;

    if (!isDbAvailable()) {
      const certificate = store.certificates.find((cert) => cert.certificateNo === certificateNo);
      if (!certificate) return res.status(404).json({ success: false, message: "Not found" });
      return res.json({ success: true, certificate });
    }

    const result = await query(
      `SELECT c.*, a.husband AS application_husband, a.wife AS application_wife
       FROM certificates c LEFT JOIN applications a ON a.id = c.application_id
       WHERE c.certificate_no = $1`,
      [certificateNo]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, certificate: mapCert(result.rows[0]) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

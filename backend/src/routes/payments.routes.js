import { Router } from "express";
import { isDbAvailable, query } from "../db.js";
import { store } from "../data/store.js";

const router = Router();
const fee = Math.max(1, Number(process.env.APPLICATION_FEE_KES || 1000));
const mpesaBaseUrl = (process.env.MPESA_ENVIRONMENT || process.env.MPESA_ENV) === "production"
  ? "https://api.safaricom.co.ke"
  : "https://sandbox.safaricom.co.ke";
const demoMode = process.env.MPESA_DEMO_MODE === "true";

const findApplication = async (id) => {
  if (isDbAvailable()) {
    const result = await query("SELECT * FROM applications WHERE id = $1", [id]);
    return result.rows[0] || null;
  }
  return store.applications.find((application) => application.id === id) || null;
};

router.get("/config", (_req, res) => res.json({ success: true, amount: fee, currency: "KES", demoMode }));

const savePayment = async (application, { status, receipt, amount = fee, checkoutId, demo = false }) => {
  if (isDbAvailable()) {
    await query(
      "UPDATE applications SET payment_status = $1, payment_receipt = $2, payment_amount = $3, payment_checkout_id = COALESCE($4, payment_checkout_id), payment_demo = $5 WHERE id = $6",
      [status, receipt || null, amount, checkoutId || null, demo, application.id]
    );
  } else {
    Object.assign(application, { paymentStatus: status, paymentReceipt: receipt || null, paymentAmount: amount, paymentDemo: demo });
    if (checkoutId) application.paymentCheckoutId = checkoutId;
  }
};

router.post("/mpesa/stk-push", async (req, res) => {
  try {
    const { applicationId, phone } = req.body || {};
    if (!applicationId || !/^254\d{9}$/.test(String(phone || ""))) {
      return res.status(400).json({ success: false, message: "Provide an application reference and a phone number in 254XXXXXXXXX format." });
    }
    const application = await findApplication(applicationId);
    if (!application) return res.status(404).json({ success: false, message: "Application not found" });
    if ((application.payment_status || application.paymentStatus) === "paid") return res.status(409).json({ success: false, message: "This application is already paid." });

    if (demoMode) {
      const demoCheckoutId = `DEMO-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await savePayment(application, { status: "pending", checkoutId: demoCheckoutId, demo: true });
      setTimeout(() => {
        savePayment(application, { status: "paid", receipt: `DEMO-${demoCheckoutId.slice(-10)}`, checkoutId: demoCheckoutId, demo: true })
          .catch((error) => console.error("Demo payment confirmation failed:", error.message));
      }, 30_000);
      return res.json({
        success: true,
        demoMode: true,
        message: "Demo payment started. A simulated confirmation will arrive in 30 seconds.",
        checkoutRequestId: demoCheckoutId,
      });
    }

    const { MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE, MPESA_PASSKEY, MPESA_CALLBACK_URL } = process.env;
    if (![MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE, MPESA_PASSKEY, MPESA_CALLBACK_URL].every(Boolean)) {
      return res.status(503).json({ success: false, message: "M-Pesa is not configured. Add the Daraja credentials and callback URL to the backend environment." });
    }

    const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString("base64");
    const authResponse = await fetch(`${mpesaBaseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${auth}` },
    });
    const authData = await authResponse.json();
    if (!authResponse.ok || !authData.access_token) {
      console.error("Daraja OAuth rejected the sandbox credentials:", authData.errorCode || authData.error || authData.error_description || `HTTP ${authResponse.status}`);
      return res.status(502).json({
        success: false,
        message: authData.errorMessage || authData.error_description || "Daraja rejected the Consumer Key and Secret. Confirm they are copied from the same sandbox app and contain no spaces.",
        errorCode: authData.errorCode || undefined,
      });
    }

    const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
    const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString("base64");
    const response = await fetch(`${mpesaBaseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: { Authorization: `Bearer ${authData.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        BusinessShortCode: MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: fee,
        PartyA: phone,
        PartyB: MPESA_SHORTCODE,
        PhoneNumber: phone,
        CallBackURL: MPESA_CALLBACK_URL,
        AccountReference: String(applicationId).slice(0, 12),
        TransactionDesc: "Marriage application fee",
      }),
    });
    const result = await response.json();
    if (!response.ok || result.ResponseCode !== "0") {
      return res.status(502).json({ success: false, message: result.errorMessage || result.ResponseDescription || "Safaricom could not start the M-Pesa payment." });
    }
    if (isDbAvailable()) {
      await query("UPDATE applications SET payment_status = 'pending', payment_checkout_id = $1, payment_amount = $2 WHERE id = $3", [result.CheckoutRequestID, fee, applicationId]);
    } else {
      application.paymentStatus = "pending";
      application.paymentCheckoutId = result.CheckoutRequestID;
      application.paymentAmount = fee;
    }
    res.json({ success: true, message: "Check your phone and enter your M-Pesa PIN to pay.", checkoutRequestId: result.CheckoutRequestID, customerMessage: result.CustomerMessage });
  } catch (error) {
    console.error("M-Pesa STK push failed:", error.message);
    res.status(502).json({ success: false, message: error.message || "Could not start the M-Pesa payment." });
  }
});

router.post("/mpesa/callback", async (req, res) => {
  try {
    const callback = req.body?.Body?.stkCallback;
    if (!callback) return res.status(400).json({ ResultCode: 1, ResultDesc: "Invalid callback" });
    if (callback.ResultCode === 0) {
      const items = callback.CallbackMetadata?.Item || [];
      const receipt = items.find((item) => item.Name === "MpesaReceiptNumber")?.Value;
      const amount = items.find((item) => item.Name === "Amount")?.Value;
      const phone = items.find((item) => item.Name === "PhoneNumber")?.Value;
      if (receipt) {
        if (isDbAvailable()) {
          await query("UPDATE applications SET payment_status = 'paid', payment_receipt = $1, payment_amount = $2 WHERE payment_checkout_id = $3", [receipt, amount || fee, callback.CheckoutRequestID]);
        } else {
          const application = store.applications.find((item) => item.paymentCheckoutId === callback.CheckoutRequestID);
          if (application) Object.assign(application, { paymentStatus: "paid", paymentReceipt: receipt, paymentAmount: amount || fee, paymentPhone: phone });
        }
      }
    } else {
      if (isDbAvailable()) await query("UPDATE applications SET payment_status = 'failed' WHERE payment_checkout_id = $1", [callback.CheckoutRequestID]);
      else {
        const application = store.applications.find((item) => item.paymentCheckoutId === callback.CheckoutRequestID);
        if (application) application.paymentStatus = "failed";
      }
    }
    res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (error) {
    console.error("M-Pesa callback processing failed:", error.message);
    res.status(500).json({ ResultCode: 1, ResultDesc: "Callback processing failed" });
  }
});

router.get("/:applicationId/status", async (req, res) => {
  try {
    const application = await findApplication(req.params.applicationId);
    if (!application) return res.status(404).json({ success: false, message: "Application not found" });
    res.json({ success: true, status: application.payment_status || application.paymentStatus || "unpaid", amount: application.payment_amount || application.paymentAmount || fee, receipt: application.payment_receipt || application.paymentReceipt || null, demoMode: application.payment_demo || application.paymentDemo || false });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

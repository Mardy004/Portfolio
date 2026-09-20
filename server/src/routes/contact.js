import { Router } from "express";
import { create, update } from "../config/store.js";
import { sendContactEmails, isMailerReady } from "../utils/mailer.js";

const router = Router();

/**
 * POST /api/contact  (public)
 * Body: { name, email, subject?, message }
 * Stores the message, sends it to ikiuzwemariette@gmail.com (MAIL_TO),
 * and sends a "thank you" auto-reply to the visitor's email.
 * Delivery outcome (emailed / mailError) is saved on the record so the
 * admin inbox can show per-message email status.
 */
router.post("/", async (req, res) => {
  const { name, email, subject, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: "Name, email and message are required.",
    });
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) {
    return res
      .status(400)
      .json({ success: false, message: "Please provide a valid email." });
  }

  try {
    const record = await create("messages", {
      name,
      email,
      subject: subject || "",
      message,
      read: false,
      emailed: false,
      mailError: null,
    });

    let emailed = false;
    let mailError = null;
    if (isMailerReady()) {
      try {
        await sendContactEmails({ name, email, subject, message });
        emailed = true;
      } catch (err) {
        mailError = err.message;
        console.error("[contact] Email failed:", err.message);
      }
    } else {
      mailError = "Email service is not configured on the server.";
    }

    // Persist the delivery outcome — never fail the request over this.
    let saved = record;
    try {
      saved = await update("messages", record.id, { emailed, mailError });
    } catch (persistError) {
      console.error("[contact] Could not save email status:", persistError.message);
      saved = { ...record, emailed, mailError };
    }

    return res.status(201).json({
      success: true,
      emailed,
      message: emailed
        ? "Message sent successfully. A thank-you email was sent to your inbox."
        : mailError
          ? "Message saved, but email delivery failed: " + mailError
          : "Message received, but email delivery is not configured on the server.",
      data: saved,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: error.message });
  }
});

export default router;
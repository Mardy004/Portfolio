import nodemailer from "nodemailer";

let transporter = null;
let mailerReady = false;

const AMP = String.fromCharCode(38);

function escapeHtml(value = "") {
  return String(value)
    .split(AMP).join(AMP + "amp;")
    .split("<").join(AMP + "lt;")
    .split(">").join(AMP + "gt;")
    .split('"').join(AMP + "quot;")
    .split("'").join(AMP + "#039;");
}

/**
 * Build the SMTP transporter from environment variables.
 * Falls back gracefully (mailer disabled) when config is missing.
 */
export function initMailer() {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } =
    process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.log("[mailer] SMTP not configured - contact emails disabled.");
    return false;
  }

  // Gmail app passwords are shown with spaces ("xxxx xxxx xxxx xxxx")
  // but must be used without spaces.
  const cleanPass = String(SMTP_PASS).replace(/\s+/g, "");

  try {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT || 465),
      secure: String(SMTP_SECURE || "true").toLowerCase() !== "false",
      auth: {
        user: SMTP_USER,
        pass: cleanPass,
      },
    });
    mailerReady = true;
    console.log("[mailer] SMTP transporter ready.");

    // Verify credentials in the background so a bad password is
    // reported at startup instead of at first form submit.
    transporter.verify((error) => {
      if (error) {
        console.error("[mailer] SMTP verify failed:", error.message);
        console.error(
          "[mailer] Tip: for Gmail use a 16-char App Password " +
            "(Google Account > Security > 2-Step Verification > App passwords), " +
            "not your normal password."
        );
      } else {
        console.log("[mailer] SMTP connection verified.");
      }
    });
  } catch (error) {
    console.error("[mailer] Failed to create transporter:", error.message);
    mailerReady = false;
  }

  return mailerReady;
}

export function isMailerReady() {
  return mailerReady;
}

export function getMailerStatus() {
  return {
    ready: mailerReady,
    host: process.env.SMTP_HOST || null,
    port: Number(process.env.SMTP_PORT || 465),
    user: process.env.SMTP_USER || null,
    to: process.env.MAIL_TO || process.env.SMTP_USER || null,
    passLength: process.env.SMTP_PASS
      ? String(process.env.SMTP_PASS).replace(/[\s"']/g, "").length
      : 0,
  };
}

/**
 * Send the "new contact message" notification to the site owner and an
 * acknowledgement to the visitor.
 */
export async function sendContactEmails({ name, email, subject, message }) {
  if (!mailerReady || !transporter) {
    throw new Error("Email service is not configured.");
  }

  // Owner inbox — the message is delivered here.
  const owner = process.env.MAIL_TO || "ikuzwemariette@gmail.com";
  const from = process.env.SMTP_USER;

  // Fail fast with a clear message instead of a cryptic SMTP error.
  if (!from) {
    throw new Error("SMTP_USER is missing in server/.env.");
  }
  if (!owner) {
    throw new Error("MAIL_TO is missing in server/.env.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("The visitor email address is invalid: " + email);
  }

  const summary = [
    "Name: " + name,
    "Email: " + email,
    "Subject: " + (subject || "(none)"),
    "",
    "Message:",
    message,
  ].join("\n");

  const ownerHtml =
    '<div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#0f172a">' +
    "<h2>New portfolio message</h2>" +
    "<p><strong>Name:</strong> " + escapeHtml(name) + "</p>" +
    "<p><strong>Email:</strong> " + escapeHtml(email) + "</p>" +
    "<p><strong>Subject:</strong> " + escapeHtml(subject || "(none)") + "</p>" +
    '<div style="padding:12px;border-radius:8px;background:#f1f5f9;white-space:pre-wrap">' +
    escapeHtml(message) +
    "</div></div>";

  const visitorHtml =
    '<div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#0f172a">' +
    "<h2>Thanks for reaching out, " + escapeHtml(name) + "!</h2>" +
    "<p>I have received your message and will get back to you as soon as possible.</p>" +
    '<p style="color:#64748b">- Mariette Ikuzwe</p></div>';

  // 1) Notify the owner — message lands in the site inbox.
  // Reply-To is the visitor so you can hit "Reply" in Gmail.
  let ownerInfo;
  try {
    ownerInfo = await transporter.sendMail({
      from: "Portfolio Contact <" + from + ">",
      to: owner,
      replyTo: email,
      subject: "New portfolio message" + (subject ? ": " + subject : "") + " — from " + (name || email),
      text: summary,
      html: ownerHtml,
    });
    console.log("[contact] owner email sent:", ownerInfo.messageId, "->", owner);
  } catch (ownerError) {
    console.error("[contact] owner email FAILED:", ownerError.message);
    throw new Error("Could not deliver to " + owner + ": " + ownerError.message);
  }

  // 2) Acknowledge the visitor ("thank you for contacting us").
  // Never let a bad visitor address hide the fact the owner got the message.
  try {
    const visitorInfo = await transporter.sendMail({
      from: "Mariette Ikuzwe <" + from + ">",
      to: email,
      subject: "Thank you for contacting us",
      text:
        "Hi " + name + ",\n\nThank you for contacting us. " +
        "I have received your message and will reply as soon as possible.\n\n" +
        "Best regards,\nMariette Ikuzwe",
      html: visitorHtml,
    });
    console.log("[contact] thank-you email sent:", visitorInfo.messageId, "->", email);
  } catch (visitorError) {
    console.error("[contact] thank-you email FAILED:", visitorError.message);
  }

  return true;
}
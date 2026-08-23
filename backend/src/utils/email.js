const nodemailer = require("nodemailer");

// Build the SMTP transporter once, reuse it for every email
let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

/**
 * Sends an email. If EMAIL_DEBUG=true (or SMTP creds are missing),
 * it just logs to the console instead of actually sending -
 * handy for local development / demo without a real mailbox.
 */
async function sendEmail({ to, subject, html }) {
  const debugMode =
    process.env.EMAIL_DEBUG === "true" ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS;

  if (debugMode) {
    console.log("\n----- [EMAIL - DEBUG MODE, NOT ACTUALLY SENT] -----");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Body:", html);
    console.log("----------------------------------------------------\n");
    return { debug: true };
  }

  try {
    const info = await getTransporter().sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    return info;
  } catch (err) {
    // Never let an email failure break the main request (status update, etc.)
    console.error("Email send failed:", err.message);
    return { error: err.message };
  }
}

function statusChangeEmail({ residentName, complaintTitle, complaintId, newStatus, note }) {
  return {
    subject: `Complaint #${complaintId} status updated: ${newStatus}`,
    html: `
      <p>Hi ${residentName},</p>
      <p>Your complaint <strong>"${complaintTitle}"</strong> (#${complaintId}) status has been updated to
      <strong>${newStatus.replace("_", " ")}</strong>.</p>
      ${note ? `<p><em>Note from admin:</em> ${note}</p>` : ""}
      <p>You can log in to the Society Maintenance Tracker to view the full history.</p>
    `,
  };
}

function importantNoticeEmail({ residentName, title, content }) {
  return {
    subject: `📌 Important Notice: ${title}`,
    html: `
      <p>Hi ${residentName},</p>
      <p>A new important notice has been posted on the Society Notice Board:</p>
      <h3>${title}</h3>
      <p>${content}</p>
    `,
  };
}

module.exports = { sendEmail, statusChangeEmail, importantNoticeEmail };

/**
 * Test Gmail SMTP auth directly with nodemailer to debug the
 * "535 Username and Password not accepted" error.
 */

const nodemailer = require("nodemailer");

const user = process.env.GMAIL_USER;
const pass = process.env.GMAIL_APP_PASSWORD;

console.log("=== Gmail SMTP Auth Test ===");
console.log("GMAIL_USER:", user);
console.log("GMAIL_APP_PASSWORD length:", pass?.length);
console.log(
  "GMAIL_APP_PASSWORD (first 4 chars):",
  pass?.substring(0, 4) + "...",
);

if (!user || !pass) {
  console.error("❌ Missing env vars");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user, pass },
});

(async () => {
  console.log("\n--- Verifying SMTP connection ---");
  try {
    await transporter.verify();
    console.log("✅ SMTP connection verified — credentials are VALID");

    console.log("\n--- Sending test email ---");
    const info = await transporter.sendMail({
      from: `Tare Wellness <${user}>`,
      to: user, // send to self for testing
      subject: "Tare Wellness — Gmail SMTP test",
      text: "This is a test email from the Tare Wellness app.",
      html: "<p>This is a test email from the <strong>Tare Wellness</strong> app.</p>",
    });
    console.log("✅ Email sent!");
    console.log("   messageId:", info.messageId);
    console.log("   response:", info.response);
  } catch (err) {
    console.error("❌ Failed:", err.message);
    console.error("\nFull error:");
    console.error(err);
  }
})();

/**
 * Debug Brevo email delivery — query the Brevo API for the delivery
 * status of recent transactional emails.
 *
 * Usage: node scripts/debug-brevo.js
 */

const { BrevoClient } = require("@getbrevo/brevo");

const apiKey = process.env.BREVO_API_KEY;
if (!apiKey) {
  console.error("❌ BREVO_API_KEY not set");
  process.exit(1);
}

const brevo = new BrevoClient({ apiKey });

const safeStringify = (val) => {
  try {
    if (val == null) return "(null)";
    if (Array.isArray(val)) return val.length === 0 ? "[]" : JSON.stringify(val);
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  } catch {
    return "(unstringifiable)";
  }
};

(async () => {
  console.log("=== Brevo Email Delivery Debug ===\n");

  // 1. Get recent email events (last 7 days)
  console.log("--- 1. Recent email events (last 7 days) ---");
  try {
    const events = await brevo.transactionalEmails.getEmailEventReport({
      limit: 20,
      offset: 0,
      days: 7,
      sort: "desc",
    });
    const list = events.events || [];
    console.log("Total events:", list.length);
    list.forEach((e, i) => {
      console.log(`\n[${i + 1}] event: ${e.event || "(unknown)"}`);
      console.log("    email:", e.email || "(unknown)");
      console.log("    subject:", (e.subject || "").substring(0, 80));
      console.log("    messageId:", e.messageId || "(none)");
      console.log("    reason:", e.reason || "(none)");
      console.log("    date:", e.date || "(none)");
      console.log("    tag:", safeStringify(e.tag));
      console.log("    from:", safeStringify(e.from));
      console.log("    raw:", safeStringify(e).substring(0, 500));
    });
  } catch (err) {
    console.error("Failed to fetch events:", err.message || err);
    if (err.body) console.error("Body:", JSON.stringify(err.body).substring(0, 500));
  }

  // 2. List recent transactional emails — needs at least one filter
  console.log("\n\n--- 2. Recent sends to mumtaz.sidiai@gmail.com ---");
  try {
    const sends = await brevo.transactionalEmails.getTransacEmailsList({
      email: "mumtaz.sidiai@gmail.com",
      limit: 10,
      offset: 0,
      sort: "desc",
    });
    const list = sends.transactionalEmails || [];
    console.log("Total sends to that address:", list.length);
    list.forEach((e, i) => {
      console.log(`\n[${i + 1}] messageId: ${e.messageId || "(none)"}`);
      console.log("    from:", safeStringify(e.from));
      console.log("    to:", safeStringify(e.to));
      console.log("    subject:", (e.subject || "").substring(0, 80));
      console.log("    date:", e.date || "(none)");
    });
  } catch (err) {
    console.error("Failed to fetch sends:", err.message || err);
    if (err.body) console.error("Body:", JSON.stringify(err.body).substring(0, 500));
  }
})();


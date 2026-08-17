/**
 * Try to create a sender using brevosend.com domain — see if Brevo
 * allows it without requiring email verification (since they own
 * the domain).
 */

const { BrevoClient } = require("@getbrevo/brevo");

const apiKey = process.env.BREVO_API_KEY;
if (!apiKey) {
  console.error("❌ BREVO_API_KEY not set");
  process.exit(1);
}

const brevo = new BrevoClient({ apiKey });

(async () => {
  console.log("=== Trying to create noreply@brevosend.com sender ===\n");
  try {
    const res = await brevo.senders.createSender({
      name: "Tare Wellness",
      email: "noreply@brevosend.com",
    });
    console.log("✅ Created:", JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("❌ Failed:", err.message || err);
    if (err.body) {
      console.error("Body:", JSON.stringify(err.body, null, 2).substring(0, 1000));
    }
    console.error("Status:", err.status || err.statusCode);
  }
})();

/**
 * List all senders configured in the Brevo account — shows which
 * email addresses and domains are actually verified and usable.
 */

const { BrevoClient } = require("@getbrevo/brevo");

const apiKey = process.env.BREVO_API_KEY;
if (!apiKey) {
  console.error("❌ BREVO_API_KEY not set");
  process.exit(1);
}

const brevo = new BrevoClient({ apiKey });

(async () => {
  console.log("=== Senders in this Brevo account ===\n");
  try {
    const res = await brevo.senders.getSenders({ limit: 50 });
    const senders = res.senders || [];
    console.log(`Found ${senders.length} sender(s):\n`);
    senders.forEach((s, i) => {
      console.log(`[${i + 1}] name: ${s.name || "(no name)"}`);
      console.log(`    email: ${s.email || "(no email)"}`);
      console.log(`    ip: ${JSON.stringify(s.ip || [])}`);
      console.log(`    active: ${s.active}`);
      console.log(`    domainId: ${s.domainId ?? "(none)"}`);
      console.log(`    raw: ${JSON.stringify(s).substring(0, 400)}\n`);
    });
  } catch (err) {
    console.error("Failed:", err.message || err);
    if (err.body) console.error("Body:", JSON.stringify(err.body).substring(0, 500));
  }
})();

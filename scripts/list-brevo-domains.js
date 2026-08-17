/**
 * List all domains configured in the Brevo account.
 */

const { BrevoClient } = require("@getbrevo/brevo");

const apiKey = process.env.BREVO_API_KEY;
if (!apiKey) {
  console.error("❌ BREVO_API_KEY not set");
  process.exit(1);
}

const brevo = new BrevoClient({ apiKey });

(async () => {
  console.log("=== Domains in this Brevo account ===\n");
  try {
    const res = await brevo.domains.getDomains({ limit: 50 });
    const domains = res.domains || [];
    console.log(`Found ${domains.length} domain(s):\n`);
    domains.forEach((d, i) => {
      console.log(`[${i + 1}] domain: ${d.domain || "(none)"}`);
      console.log(`    active: ${d.active}`);
      console.log(`    raw: ${JSON.stringify(d).substring(0, 500)}\n`);
    });
  } catch (err) {
    console.error("Failed:", err.message || err);
    if (err.body) console.error("Body:", JSON.stringify(err.body).substring(0, 500));
  }
})();

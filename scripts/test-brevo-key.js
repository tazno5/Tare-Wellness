/**
 * Test Brevo API key + check domain verification status
 * using raw fetch (no SDK needed).
 */

const apiKey = process.env.BREVO_API_KEY;
if (!apiKey) {
  console.error("❌ BREVO_API_KEY not set");
  process.exit(1);
}

const BASE = "https://api.brevo.com/v3";

async function main() {
  console.log("=== Brevo API Key Test ===\n");
  console.log("API key (first 20 chars):", apiKey.substring(0, 20) + "...");

  // 1. Get account info (verifies key is valid)
  console.log("\n--- 1. Account info ---");
  try {
    const res = await fetch(`${BASE}/account`, {
      headers: { "api-key": apiKey },
    });
    if (res.status === 401) {
      console.error("❌ API key is INVALID (401 Unauthorized)");
      const body = await res.json();
      console.error("Body:", JSON.stringify(body));
      process.exit(1);
    }
    if (!res.ok) {
      console.error(`❌ API error: ${res.status}`);
      const body = await res.text();
      console.error("Body:", body.substring(0, 500));
      process.exit(1);
    }
    const account = await res.json();
    console.log("✅ API key is VALID");
    console.log("  Email:", account.email);
    console.log("  First name:", account.firstName);
    console.log("  Last name:", account.lastName);
    console.log("  Company:", account.companyName);
    console.log("  Plan:", JSON.stringify(account.plan));
  } catch (err) {
    console.error("❌ Network error:", err.message);
    process.exit(1);
  }

  // 2. List domains (checks if tarewellness.com is verified)
  console.log("\n--- 2. Domains ---");
  try {
    const res = await fetch(`${BASE}/senders/domains`, {
      headers: { "api-key": apiKey },
    });
    if (res.ok) {
      const data = await res.json();
      const domains = data.domains || [];
      console.log(`Found ${domains.length} domain(s):`);
      domains.forEach((d, i) => {
        console.log(`  [${i + 1}] ${d.domain}`);
        console.log(`      active: ${d.active}`);
        console.log(`      verified: ${d.verified ?? "(not shown)"}`);
      });
    } else {
      const body = await res.text();
      console.log(`Domains endpoint returned ${res.status}:`, body.substring(0, 300));
    }
  } catch (err) {
    console.error("Failed to fetch domains:", err.message);
  }

  // 3. List senders
  console.log("\n--- 3. Senders ---");
  try {
    const res = await fetch(`${BASE}/senders`, {
      headers: { "api-key": apiKey },
    });
    if (res.ok) {
      const data = await res.json();
      const senders = data.senders || [];
      console.log(`Found ${senders.length} sender(s):`);
      senders.forEach((s, i) => {
        console.log(`  [${i + 1}] ${s.name} <${s.email}>`);
        console.log(`      id: ${s.id}, active: ${s.active}`);
      });
    } else {
      const body = await res.text();
      console.log(`Senders endpoint returned ${res.status}:`, body.substring(0, 300));
    }
  } catch (err) {
    console.error("Failed to fetch senders:", err.message);
  }

  // 4. Try to create sender hello@tarewellness.com (if domain is verified)
  console.log("\n--- 4. Creating hello@tarewellness.com sender ---");
  try {
    const res = await fetch(`${BASE}/senders`, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Tare Wellness",
        email: "hello@tarewellness.com",
      }),
    });
    const body = await res.json();
    if (res.status === 201) {
      console.log("✅ Sender created:", JSON.stringify(body));
    } else if (res.status === 400 && body.code === "duplicate_parameter") {
      console.log("✅ Sender already exists (duplicate_parameter) — that's fine");
    } else if (res.status === 400 && body.message?.includes("DMARC")) {
      console.log("❌ Domain NOT verified yet — Brevo rejected sender creation");
      console.log("Body:", JSON.stringify(body));
    } else {
      console.log(`⚠️ Status ${res.status}:`, JSON.stringify(body));
    }
  } catch (err) {
    console.error("Failed to create sender:", err.message);
  }
}

main();

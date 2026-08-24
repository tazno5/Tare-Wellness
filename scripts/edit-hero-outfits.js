/**
 * Batch edit all hero images — change character outfit globally
 * Uses z-ai-web-dev-sdk directly with base64-encoded images
 */

const ZAI = require('z-ai-web-dev-sdk').default;
const fs = require('fs');
const path = require('path');

const OUTFIT_PROMPT = "Change the male character's outfit to: a plain black short-sleeve crew-neck t-shirt, tailored light-beige chino shorts ending just above the knee, clean white minimalist low-top sneakers, a thin silver chain necklace, and a black smartwatch on left wrist. Keep the character's face, skin tone, body proportions, original pose, art style, background, and all other elements 100% unchanged.";

const IMAGES = [
  "public/hero-home.png",
  "public/hero-giftcards.png",
  "public/hero-redeem.png",
  "public/hero-book-session.png",
  "public/hero-booking-confirmation.png",
  "public/hero-cart-review.png",
  "public/hero-checkout.png",
  "public/hero-confirmation.png",
  "public/hero-contact.png",
  "public/hero-faq.png",
  "public/hero-how-it-works.png",
  "public/hero-login.png",
  "public/hero-recipient.png",
  "public/hero-privacy.png",
  "public/hero-terms.png",
];

async function main() {
  const zai = await ZAI.create();
  let success = 0;
  let fail = 0;

  // Backup directory
  const backupDir = "public/hero-backup";
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log("=== Backing up originals ===");
  for (const imgPath of IMAGES) {
    if (fs.existsSync(imgPath)) {
      const backupPath = path.join(backupDir, path.basename(imgPath));
      fs.copyFileSync(imgPath, backupPath);
      console.log(`  ✓ ${path.basename(imgPath)}`);
    }
  }

  console.log("\n=== Editing images ===");

  for (const imgPath of IMAGES) {
    if (!fs.existsSync(imgPath)) {
      console.log(`  ✗ SKIP: ${imgPath} not found`);
      fail++;
      continue;
    }

    const basename = path.basename(imgPath);
    process.stdout.write(`  ${basename}... `);

    try {
      // Read image and convert to base64 data URL
      const imageBuffer = fs.readFileSync(imgPath);
      const base64 = imageBuffer.toString('base64');
      const dataUrl = `data:image/png;base64,${base64}`;

      const response = await zai.images.generations.edit({
        prompt: OUTFIT_PROMPT,
        images: [{ url: dataUrl }],
        size: '1024x1024',
      });

      if (!response.data || !response.data[0] || !response.data[0].base64) {
        throw new Error('No image data in response');
      }

      const editedBuffer = Buffer.from(response.data[0].base64, 'base64');
      fs.writeFileSync(imgPath, editedBuffer);

      const sizeKB = Math.round(editedBuffer.length / 1024);
      console.log(`✓ (${sizeKB}KB)`);
      success++;
    } catch (error) {
      console.log(`✗ ${error.message?.substring(0, 100) || 'Unknown error'}`);
      fail++;
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n=== Summary ===`);
  console.log(`  Success: ${success}`);
  console.log(`  Failed: ${fail}`);
  console.log(`  Backups: ${backupDir}/`);
}

main().catch(console.error);

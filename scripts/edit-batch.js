const ZAI = require('z-ai-web-dev-sdk').default;
const fs = require('fs');
const path = require('path');

const PROMPT = "Change the male character's outfit to: a plain black short-sleeve crew-neck t-shirt, tailored light-beige chino shorts ending just above the knee, clean white minimalist low-top sneakers, a thin silver chain necklace, and a black smartwatch on left wrist. Keep everything else unchanged.";

// Get the batch number from command line arg
const batchNum = parseInt(process.argv[2] || '1');
const BATCH_SIZE = 4;

const ALL_IMAGES = [
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
  "public/hero.png",
];

const start = (batchNum - 1) * BATCH_SIZE;
const end = Math.min(start + BATCH_SIZE, ALL_IMAGES.length);
const BATCH = ALL_IMAGES.slice(start, end);

async function main() {
  const zai = await ZAI.create();
  let success = 0, fail = 0;

  // Backup dir
  if (!fs.existsSync('public/hero-backup')) {
    fs.mkdirSync('public/hero-backup', { recursive: true });
  }

  console.log(`=== Batch ${batchNum} (${BATCH.length} images: ${BATCH.map(p=>path.basename(p)).join(', ')}) ===`);

  for (const imgPath of BATCH) {
    if (!fs.existsSync(imgPath)) {
      console.log(`  ✗ SKIP: ${imgPath} not found`);
      fail++;
      continue;
    }

    const basename = path.basename(imgPath);
    process.stdout.write(`  ${basename}... `);

    try {
      // Backup
      const backupPath = path.join('public/hero-backup', basename);
      if (!fs.existsSync(backupPath)) {
        fs.copyFileSync(imgPath, backupPath);
      }

      const buf = fs.readFileSync(imgPath);
      const b64 = buf.toString('base64');
      const dataUrl = 'data:image/png;base64,' + b64;

      const res = await zai.images.generations.edit({
        prompt: PROMPT,
        images: [{ url: dataUrl }],
        size: '1024x1024',
      });

      if (!res.data || !res.data[0] || !res.data[0].base64) {
        throw new Error('No image data');
      }

      const edited = Buffer.from(res.data[0].base64, 'base64');
      fs.writeFileSync(imgPath, edited);
      console.log(`✓ (${Math.round(edited.length/1024)}KB)`);
      success++;
    } catch (e) {
      console.log(`✗ ${e.message?.substring(0, 80) || 'error'}`);
      fail++;
    }

    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`Batch ${batchNum}: ${success} success, ${fail} fail\n`);
}

main().catch(console.error);

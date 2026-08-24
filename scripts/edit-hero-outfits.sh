#!/bin/bash
# Batch edit all hero images — change character outfit globally
# Uses z-ai image-edit CLI

OUTFIT_PROMPT="Change the male character's outfit to: a plain black short-sleeve crew-neck t-shirt, tailored light-beige chino shorts ending just above the knee, clean white minimalist low-top sneakers, a thin silver chain necklace, and a black smartwatch on left wrist. Keep the character's face, skin tone, body proportions, original pose, art style, background, and all other elements 100% unchanged."

IMAGES=(
  "public/hero-home.png"
  "public/hero-giftcards.png"
  "public/hero-redeem.png"
  "public/hero-book-session.png"
  "public/hero-booking-confirmation.png"
  "public/hero-cart-review.png"
  "public/hero-checkout.png"
  "public/hero-confirmation.png"
  "public/hero-contact.png"
  "public/hero-faq.png"
  "public/hero-how-it-works.png"
  "public/hero-login.png"
  "public/hero-recipient.png"
  "public/hero-privacy.png"
  "public/hero-terms.png"
  "public/hero.png"
)

mkdir -p public/hero-backup

echo "=== Backing up original images ==="
for img in "${IMAGES[@]}"; do
  if [ -f "$img" ]; then
    cp "$img" "public/hero-backup/$(basename $img)"
    echo "  ✓ Backed up $(basename $img)"
  fi
done

echo ""
echo "=== Editing images (this will take a few minutes) ==="
SUCCESS=0
FAIL=0

for img in "${IMAGES[@]}"; do
  if [ ! -f "$img" ]; then
    echo "  ✗ SKIP: $img not found"
    ((FAIL++))
    continue
  fi

  basename=$(basename "$img")
  echo -n "  Processing $basename... "

  # Use z-ai image-edit CLI
  result=$(z-ai image-edit \
    -p "$OUTFIT_PROMPT" \
    -i "$img" \
    -o "/tmp/edited-$basename" \
    -s "1024x1024" 2>&1)

  if [ $? -eq 0 ] && [ -f "/tmp/edited-$basename" ]; then
    # Replace original with edited version
    cp "/tmp/edited-$basename" "$img"
    rm "/tmp/edited-$basename"
    echo "✓ Done"
    ((SUCCESS++))
  else
    echo "✗ Failed: $result"
    ((FAIL++))
  fi
done

echo ""
echo "=== Summary ==="
echo "  Success: $SUCCESS"
echo "  Failed: $FAIL"
echo "  Backups in: public/hero-backup/"

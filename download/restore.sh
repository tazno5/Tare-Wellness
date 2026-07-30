#!/bin/bash
# Tare Wellness — Restore from Backup
# Run this if the sandbox resets and pages go missing.
# Usage: bash restore.sh

set -e
cd /home/z/my-project

echo "=== Restoring from backup ==="
if [ ! -f download/tare-wellness-backup.tar.gz ]; then
  echo "ERROR: Backup file not found at download/tare-wellness-backup.tar.gz"
  exit 1
fi

# Extract the backup (overwrites existing files)
tar xzf download/tare-wellness-backup.tar.gz

echo "=== Restored files ==="
find src/app -name "page.tsx" | sort
echo ""
echo "=== Done. Refresh the preview. ==="

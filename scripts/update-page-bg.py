#!/usr/bin/env python3
"""
Update all page-level gradient overrides to use #FFF5EE (flat, no gradient).
Replaces any setProperty("--page-gradient-from", "#FCE4EC") or "#F10897" etc.
with setProperty("--page-gradient-from", "#FFF5EE") and same for --page-gradient-to.
"""

import re
from pathlib import Path

SRC = Path("/home/z/my-project/src")

# Pattern: setProperty("--page-gradient-from", "<any hex>")
# and      setProperty("--page-gradient-to", "<any hex>")
pattern_from = re.compile(r'(setProperty\("--page-gradient-from",\s*)"[^"]*"')
pattern_to = re.compile(r'(setProperty\("--page-gradient-to",\s*)"[^"]*"')

total = 0
files_touched = 0

for path in SRC.rglob("*.tsx"):
    if "node_modules" in str(path) or ".next" in str(path):
        continue
    text = path.read_text(encoding="utf-8")
    original = text
    
    text, n_from = pattern_from.subn(r'\g<1>"#FFF5EE"', text)
    text, n_to = pattern_to.subn(r'\g<1>"#FFF5EE"', text)
    
    count = n_from + n_to
    if count > 0:
        path.write_text(text, encoding="utf-8")
        print(f"  {path.relative_to(SRC)}: {count} swaps")
        total += count
        files_touched += 1

print(f"\nTotal: {total} swaps across {files_touched} files")

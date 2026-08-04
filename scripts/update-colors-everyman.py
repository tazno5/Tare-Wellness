#!/usr/bin/env python3
"""
Swap literal color values across all .tsx files to match the new
Everyman + Caregiver palette:

  #4E0030 (old maroon)      → #2C292E (warm charcoal)
  #3a0023 (old maroon hover) → #1F1B22 (darker charcoal hover)
  #3d002e (old maroon deep)  → #2C292E (warm charcoal)
  #FCE4EC (old blush)        → #FFF5EE (seashell cream)
  #FFF5F7 (old off-white)    → #FFFFFF (pure white)
  #F8BBD0 (old blush dark)   → #F5E8DC (warm cream dark)
  rgba(61, 0, 46, X)         → rgba(44, 41, 46, X) (shadow color)
  
Pink (#F10897 / #F20997) is PRESERVED as accent — buttons, active states, badges.
"""

import re
from pathlib import Path

SRC = Path("/home/z/my-project/src")

REPLACEMENTS = [
    # Old maroon hover variants → charcoal hover
    ("hover:bg-[#3a0023]", "hover:bg-[#1F1B22]"),
    ("bg-[#3a0023]", "bg-[#1F1B22]"),
    # Old maroon solid → charcoal solid
    ("bg-[#4E0030]", "bg-[#2C292E]"),
    ("hover:bg-[#4E0030]", "hover:bg-[#2C292E]"),
    ("bg-[#4E0030]/", "bg-[#2C292E]/"),
    # Old maroon text → charcoal text
    ("text-[#4E0030]", "text-[#2C292E]"),
    ("text-[#4E0030]/", "text-[#2C292E]/"),
    # Old maroon border → charcoal border
    ("border-[#4E0030]", "border-[#2C292E]"),
    ("border-[#4E0030]/", "border-[#2C292E]/"),
    # Old maroon ring → charcoal ring
    ("ring-[#4E0030]", "ring-[#2C292E]"),
    ("ring-[#4E0030]/", "ring-[#2C292E]/"),
    # Old deep maroon (#3d002e) → charcoal
    ("#3d002e", "#2C292E"),
    # Old blush surface → seashell cream
    ("bg-[#FCE4EC]", "bg-[#FFF5EE]"),
    ("bg-[#FCE4EC]/", "bg-[#FFF5EE]/"),
    # Old off-white → pure white
    ("bg-[#FFF5F7]", "bg-white"),
    # Old blush dark → warm cream dark
    ("from-[#FCE4EC] to-[#F8BBD0]", "from-[#FFF5EE] to-[#F5E8DC]"),
    ("#F8BBD0", "#F5E8DC"),
    # Shadow color: rgba(61,0,46,X) → rgba(44,41,46,X)
    (re.compile(r"rgba\(61,\s*0,\s*46,\s*([0-9.]+)\)"), r"rgba(44, 41, 46, \1)"),
]

def process(text):
    swaps = 0
    for old, new in REPLACEMENTS:
        if isinstance(old, str):
            count = text.count(old)
            if count:
                text = text.replace(old, new)
                swaps += count
        else:
            new_text, n = old.subn(new, text)
            if n:
                text = new_text
                swaps += n
    return text, swaps

total = 0
files_touched = 0
for path in SRC.rglob("*.tsx"):
    if "node_modules" in str(path) or ".next" in str(path):
        continue
    original = path.read_text(encoding="utf-8")
    new_text, swaps = process(original)
    if new_text != original:
        path.write_text(new_text, encoding="utf-8")
        print(f"  {path.relative_to(SRC)}: {swaps} swaps")
        total += swaps
        files_touched += 1
print(f"\nTotal: {total} swaps across {files_touched} files")

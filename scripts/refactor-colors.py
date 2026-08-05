#!/usr/bin/env python3
"""
Refactor global styling per user spec:

1. Hero H1 headings: text-maroon → text-[#F10897] (pink)
2. Hero subtext/body: text-maroon/85, text-maroon/80 → text-[#4E0030]/85, text-[#4E0030]/80
3. Primary buttons: bg-[#2C292E] → bg-[#F10897], hover:bg-[#1F1B22] → hover:bg-[#d4007d]
4. Secondary/light buttons: text-maroon on light bg → text-[#F10897]
5. Body text-maroon (non-heading) → text-[#4E0030]
6. Card titles/headings (h2/h3 inside cards): text-maroon → text-[#4E0030]
"""

import re
from pathlib import Path

SRC = Path("/home/z/my-project/src")

# We need to be surgical. Let's process file by file.
# The key insight: text-maroon currently = #2C292E (charcoal).
# We want:
#   - H1 hero headings → text-[#F10897]
#   - Hero body/subtext → text-[#4E0030] (with opacity variants)
#   - Card headings (h2, h3) → text-[#4E0030]
#   - Card body text → text-[#4E0030] (with opacity variants)
#   - Primary buttons bg-[#2C292E] → bg-[#F10897]
#   - Primary buttons hover:bg-[#1F1B22] → hover:bg-[#d4007d]
#   - Secondary buttons text-maroon on white → text-[#F10897]

# Strategy: 
# 1. Change --color-maroon in globals.css from #2C292E → #4E0030
#    This automatically updates ALL text-maroon references to #4E0030.
# 2. Then manually update H1 headings to text-[#F10897]
# 3. Then update primary buttons from bg-[#2C292E] → bg-[#F10897]
# 4. Then update secondary buttons text-maroon → text-[#F10897] where on light bg

# Step 1: Update globals.css maroon color
globals_path = SRC / "app/globals.css"
globals_text = globals_path.read_text(encoding="utf-8")
globals_text = globals_text.replace("--color-maroon: #2C292E;", "--color-maroon: #4E0030;")
globals_text = globals_text.replace("--color-maroon-soft: rgba(44, 41, 46, 0.55);", "--color-maroon-soft: rgba(78, 0, 48, 0.55);")
globals_text = globals_text.replace(".bg-maroon {\n    background-color: #2C292E;", ".bg-maroon {\n    background-color: #4E0030;")
globals_text = globals_text.replace(".text-maroon {\n    color: #2C292E;", ".text-maroon {\n    color: #4E0030;")
globals_text = globals_text.replace(".text-maroon-soft {\n    color: rgba(44, 41, 46, 0.55);", ".text-maroon-soft {\n    color: rgba(78, 0, 48, 0.55);")
globals_text = globals_text.replace(".border-maroon {\n    border-color: #2C292E;", ".border-maroon {\n    border-color: #4E0030;")
# Also update --primary, --foreground etc
globals_text = globals_text.replace("--foreground: #2C292E;", "--foreground: #4E0030;")
globals_text = globals_text.replace("--card-foreground: #2C292E;", "--card-foreground: #4E0030;")
globals_text = globals_text.replace("--popover-foreground: #2C292E;", "--popover-foreground: #4E0030;")
globals_text = globals_text.replace("--primary: #2C292E;", "--primary: #4E0030;")
globals_text = globals_text.replace("--secondary-foreground: #2C292E;", "--secondary-foreground: #4E0030;")
globals_text = globals_text.replace("--accent-foreground: #2C292E;", "--accent-foreground: #4E0030;")
globals_text = globals_text.replace("--sidebar-foreground: #2C292E;", "--sidebar-foreground: #4E0030;")
globals_text = globals_text.replace("--sidebar-primary: #2C292E;", "--sidebar-primary: #4E0030;")
globals_text = globals_text.replace("--sidebar-accent-foreground: #2C292E;", "--sidebar-accent-foreground: #4E0030;")
# Update shadows
globals_text = globals_text.replace("rgba(44, 41, 46, 0.15)", "rgba(78, 0, 48, 0.12)")
globals_text = globals_text.replace("rgba(44, 41, 46, 0.10)", "rgba(78, 0, 48, 0.08)")
# Update border
globals_text = globals_text.replace("rgba(44, 41, 46, 0.10)", "rgba(78, 0, 48, 0.10)")
# Update muted
globals_text = globals_text.replace("rgba(44, 41, 46, 0.55)", "rgba(78, 0, 48, 0.55)")
globals_path.write_text(globals_text, encoding="utf-8")
print("globals.css: maroon → #4E0030, shadows/borders updated")

# Step 2: Update all literal #2C292E → #4E0030 across all .tsx files
REPLACEMENTS_LITERAL = [
    ("bg-[#2C292E]", "bg-[#4E0030]"),
    ("hover:bg-[#2C292E]", "hover:bg-[#4E0030]"),
    ("bg-[#2C292E]/", "bg-[#4E0030]/"),
    ("text-[#2C292E]", "text-[#4E0030]"),
    ("text-[#2C292E]/", "text-[#4E0030]/"),
    ("border-[#2C292E]", "border-[#4E0030]"),
    ("border-[#2C292E]/", "border-[#4E0030]/"),
    ("ring-[#2C292E]", "ring-[#4E0030]"),
    ("ring-[#2C292E]/", "ring-[#4E0030]/"),
    ("hover:bg-[#1F1B22]", "hover:bg-[#d4007d]"),
    ("bg-[#1F1B22]", "bg-[#4E0030]"),
    # Shadow colors
    (re.compile(r"rgba\(44,\s*41,\s*46,\s*([0-9.]+)\)"), r"rgba(78, 0, 48, \1)"),
]

total = 0
files_touched = 0
for path in SRC.rglob("*.tsx"):
    if "node_modules" in str(path) or ".next" in str(path):
        continue
    text = path.read_text(encoding="utf-8")
    original = text
    for old, new in REPLACEMENTS_LITERAL:
        if isinstance(old, str):
            count = text.count(old)
            if count:
                text = text.replace(old, new)
        else:
            new_text, n = old.subn(new, text)
            if n:
                text = new_text
    if text != original:
        path.write_text(text, encoding="utf-8")
        total += 1
        files_touched += 1

print(f"Literal swaps: {files_touched} files updated (#2C292E → #4E0030, hover → #d4007d)")

# Step 3: Now update H1 hero headings to text-[#F10897]
# Pattern: className containing "font-fraunces" + "text-maroon" on h1 elements
# We'll look for motion.h1 or h1 with text-maroon
H1_PATTERN = re.compile(
    r'(<(?:motion\.)?h1[^>]*className="[^"]*?)text-maroon([^"]*")',
    re.MULTILINE
)
h1_count = 0
for path in SRC.rglob("*.tsx"):
    if "node_modules" in str(path) or ".next" in str(path):
        continue
    text = path.read_text(encoding="utf-8")
    new_text, n = H1_PATTERN.subn(r'\1text-[#F10897]\2', text)
    if n:
        path.write_text(new_text, encoding="utf-8")
        h1_count += n
        print(f"  H1 → pink: {path.relative_to(SRC)} ({n})")
print(f"H1 headings changed to #F10897: {h1_count}")

# Step 4: Update Hero.tsx H1 specifically (it uses text-maroon on the span inside h1)
hero_path = SRC / "components/site/Hero.tsx"
hero_text = hero_path.read_text(encoding="utf-8")
# The Hero h1 has: className="... text-maroon ..." and a span with text-maroon-soft
hero_text = hero_text.replace(
    'className="font-fraunces text-5xl font-extrabold leading-[1.02] tracking-tight text-maroon sm:text-6xl lg:text-7xl xl:text-8xl"',
    'className="font-fraunces text-5xl font-extrabold leading-[1.02] tracking-tight text-[#F10897] sm:text-6xl lg:text-7xl xl:text-8xl"'
)
# The span inside the h1 (text-maroon-soft → keep as a lighter pink)
hero_text = hero_text.replace(
    '<span className="text-maroon-soft">They Can Feel</span>',
    '<span className="text-[#F10897]/60">They Can Feel</span>'
)
# Hero body copy: text-maroon/80 → text-[#4E0030]/80
hero_text = hero_text.replace("text-maroon/80", "text-[#4E0030]/80")
hero_path.write_text(hero_text, encoding="utf-8")
print("Hero.tsx: H1 → #F10897, subtext → #4E0030")

# Step 5: Update secondary buttons — text-maroon on white/light bg → text-[#F10897]
# These are: Login button, mobile Login/Sign Up, footer socials, "Edit" links, etc.
# We'll be conservative: only change text-maroon to text-[#F10897] on elements that are
# clearly buttons/links with bg-white or bg-blush or bg-white/15 etc.
# The globals.css change already made text-maroon = #4E0030, so we need to override
# specific buttons.
SECONDARY_BUTTON_PATTERNS = [
    # Navbar Login button (desktop): bg-white/15 ... text-maroon
    ("bg-white/15 px-4 py-2 font-sans text-sm font-semibold text-maroon", "bg-white/15 px-4 py-2 font-sans text-sm font-semibold text-[#F10897]"),
    # Navbar mobile Login: bg-white/15 ... text-maroon
    ("bg-white/15 px-6 py-4 font-sans text-base font-semibold text-maroon", "bg-white/15 px-6 py-4 font-sans text-base font-semibold text-[#F10897]"),
    # Navbar mobile Sign Out: bg-white/15 ... text-maroon
    ("bg-white/15 px-6 py-3 font-sans text-sm font-semibold text-maroon", "bg-white/15 px-6 py-3 font-sans text-sm font-semibold text-[#F10897]"),
    # Footer social buttons: bg-blush text-maroon
    ("bg-blush text-maroon", "bg-blush text-[#F10897]"),
    # Footer links: text-maroon/85
    ("text-maroon/85 underline-offset-4", "text-[#4E0030]/85 underline-offset-4"),
    # Footer copyright: text-maroon/80
    ("text-maroon/80 sm:text-sm", "text-[#4E0030]/80 sm:text-sm"),
    # Navbar "Send a Gift" mobile: bg-[#4E0030] → bg-[#F10897]
    ("bg-[#4E0030] px-6 py-4 font-sans text-base font-semibold text-white", "bg-[#F10897] px-6 py-4 font-sans text-base font-semibold text-white"),
    # Navbar "Send a Gift" desktop: bg-[#4E0030] → bg-[#F10897]
    ("bg-[#4E0030] px-5 py-2.5 font-sans text-sm font-semibold text-white", "bg-[#F10897] px-5 py-2.5 font-sans text-sm font-semibold text-white"),
    # Hover states for Send a Gift
    ("hover:bg-[#4E0030] active:scale-95", "hover:bg-[#d4007d] active:scale-95"),
]

btn_count = 0
for path in SRC.rglob("*.tsx"):
    if "node_modules" in str(path) or ".next" in str(path):
        continue
    text = path.read_text(encoding="utf-8")
    original = text
    for old, new in SECONDARY_BUTTON_PATTERNS:
        if old in text:
            count = text.count(old)
            text = text.replace(old, new)
            btn_count += count
    if text != original:
        path.write_text(text, encoding="utf-8")

print(f"Secondary button/link colors updated: {btn_count} swaps")

# Step 6: Update the email API template
email_path = SRC / "api/email/send/route.ts"
email_text = email_path.read_text(encoding="utf-8")
email_text = email_text.replace("#2C292E", "#4E0030")
email_text = email_text.replace("rgba(44, 41, 46", "rgba(78, 0, 48")
# CTA button in email: bg-[#4E0030] → bg-[#F10897] (but it uses inline style)
email_text = email_text.replace("background: #4E0030;", "background: #F10897;")
email_path.write_text(email_text, encoding="utf-8")
print("Email API: colors updated")

print("\nDone!")

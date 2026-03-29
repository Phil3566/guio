# Quick Reference — Formatting Preferences

## Layout Principles
- **One line per entry** — task, button(s), and description all on a single line. Minimize scrolling on mobile.
- **Compact padding** — 7px vertical per row. No multi-line descriptions.
- **Grouped by user intent** — sections are what the user is trying to do, not physical panel layout.

## Entry Format
Each row follows this pattern:
```
**Task name:** [Button] → [Button] — short description.
```
- **Bold task name** comes first (e.g., "Reheat food:", "Defrost:")
- **Button names** in dark pill-shaped boxes (`.btn-tag` class: dark bg, white text, rounded)
- **Arrows** (→) show the sequence of button presses
- **Description** is inline, smaller text (12px, `.ref-desc` class), preceded by an em dash. Keep to one short phrase.

## Content Rules
- **Be concise.** Cut filler words. No "press once then press Start" — just show the sequence with arrows.
- **Be clear.** Avoid shorthand that needs decoding. Write "press once for 3.5 oz bag" not "1x=3.5oz".
- **No redundant info.** Don't repeat what's obvious from the button sequence.
- **Include only essential warnings** inline (e.g., "Don't open door until 2 beeps").

## Consolidation Rules
- **Sub-items belong with their parent.** Food codes go directly under "Cook by food", not in a separate section. Don't create standalone sections for data that only makes sense in context of a parent feature.
- **Section headers should be self-explanatory.** "Sensor Cook Codes" means nothing on its own. It belongs under the feature that uses it.

## Section Themes (current)
| Section | Color | Purpose |
|---|---|---|
| Cook & Reheat | blue | Manual cooking, reheating, power, quick 30, keep warm |
| Auto & Defrost | green | Sensor cook + food codes, defrost, popcorn |
| Clock & Timer | brown | Clock setting, kitchen timer |
| Controls | red | Pause, cancel, child lock |

## CSS Classes
- `.ref-row` — single row container (7px padding, bottom border)
- `.ref-label` — main text line (14px)
- `.ref-label strong` — bold task name
- `.ref-desc` — inline secondary text (12px, lighter color)
- `.btn-tag` — button name box (dark bg #2d2d2d, white text, 12px bold, 4px radius, 2px/8px padding)
- `.ref-codes` — flex-wrap grid for code chips (used for food codes)
- `.ref-code` — individual code chip (white bg, border, 8px radius)
- `.ref-section-header` — colored section banner (blue/green/brown/red/black)

# Microwave Oven — Device Page Layout Template

This document defines the standard layout for any microwave oven device page in the ClearLabel/Artie platform. Follow this template exactly when creating a new microwave page.

---

## Required Inputs

Before building, gather this information from the device manual:

### Device Identity
- **Brand and model** (e.g., Panasonic NN-SC73LS)
- **Product image** — clean photo, no background, two versions:
  - `[model-slug].jpg` — 400px wide (front page thumbnail)
  - `[model-slug]-full.jpg` — 1200+ px wide (fullscreen overlay)
- **Wattage** (e.g., 1200W)
- **Voltage/frequency/amps** (e.g., 120V, 60Hz, 12A)
- **Outside dimensions** (W x H x D)
- **Cavity dimensions** (W x H x D)
- **Weight**
- **Required clearance** (sides, top, back)

### Panel Layout
Map every button on the control panel. Record:
- **Button name** (exactly as printed on the panel)
- **Position** (row, column, or physical location like "top row, second from left")
- **What it does** (one sentence)
- **How to use it** (step-by-step)

### Function Reference
For each feature, document:
- **Name** (e.g., Sensor Reheat, Turbo Defrost)
- **Button sequence** (e.g., Press Sensor Reheat → Start)
- **Settings/modes** (e.g., power levels, food codes)
- **Constraints** (e.g., max weight, max time, incompatible combinations)
- **Beep signals** (what 1, 2, 5 beeps mean)

### Cleaning Instructions
- Inside, outside, door, control panel, cavity floor
- Removable parts (glass tray, roller ring, turntable coupler)
- Dishwasher-safe parts
- Products to avoid

### Troubleshooting
- Common problems and solutions (won't turn on, won't start, noise, display issues)

### Replacement Parts
- Part names and part numbers
- Where to order (URL)

### Safety Rules
- Materials that are unsafe (metal, foil, twist-ties, etc.)
- Foods that need piercing before cooking
- Foods that must not be microwaved (whole eggs, etc.)
- Safe cooking temperatures

---

## Page Structure

The page is a single HTML file with embedded CSS and JS. It has two views that toggle: **Home View** (scrollable content) and **Chat View** (conversation with Artie).

### 1. Hero Banner

```
┌──────────────────────────────────┐
│ [Owl Logo]  Hey! I'm Artie.     │
│             I'm your AI [device │
│             type] assistant...  │
│             [Brand Model]       │
└──────────────────────────────────┘
         [Product Image]
         (tap to enlarge)
```

- **Background:** teal gradient (`#1a6b5a` → `#0f4a3e` → `#0a3a30`)
- **Logo:** `mainlogo.png` (Artie the owl), 60x60px
- **Title:** "Hey! I'm **Artie.**" (Artie in gold `#f5b731`)
- **Subtitle:** "I'm your **AI** [device type] assistant. I've read every page of the **[Brand Model]** manual — ask me anything."
  - "AI" uses rainbow gradient text (`.ai-gradient`)
  - Brand Model in bold, slightly larger (16px)
- **Product image:** centered below hero, 220px wide, tap opens fullscreen overlay
- **Fullscreen overlay:** dark background (`rgba(0,0,0,0.85)`), shows full-size image, tap or "Back" button to close

### 2. Navigation Buttons

Four full-width buttons stacked vertically with 6px gap. Each button has:
- Icon (emoji, `aria-hidden`)
- Title (15px bold)
- Description (12px)
- Chevron arrow (right side)
- Distinct gradient background with white text

```
┌─ [Icon] Button Guide                    ›  ┐  Green  (#43a047 → #2e7d32)
├─ [Icon] Quick Reference                 ›  ┤  Blue   (#1e88e5 → #1565c0)
├─ [Icon] Snap & Ask Artie               ›  ┤  Orange (#f57c00 → #e65100)
└─ [Icon] Care & Info                     ›  ┘  Purple (#8e24aa → #6a1b9a)
```

Each button opens a full-screen overlay.

### 3. Button Guide Overlay

Lists every button on the control panel, grouped by function.

**Sections (colored headers):**

| Section | Header Color | Contents |
|---------|-------------|----------|
| Cooking Buttons | Blue (`#1a73e8`) | All buttons that cook food (reheat, sensor cook, popcorn, power level, defrost, keep warm, quick start) |
| Adjustment Buttons | Green (`#1e7d45`) | More, Less, number pad |
| Clock & Timer | Brown (`#8d6e1f`) | Timer, clock set |
| Controls | Red (`#b71c1c`) | Start, stop/reset, door release |

**Entry format:**
```html
<div class="ref-row">
  <div class="ref-label">
    <span class="btn-tag">Button Name</span>
    <span class="ref-desc">&mdash; what it does and how to use it.</span>
  </div>
</div>
```

- `.btn-tag` = dark pill box (`#2d2d2d` bg, white text, 12px bold, 4px radius)
- `.ref-desc` = inline description (15px, lighter color)
- One row per button, no multi-line descriptions

### 4. Quick Reference Overlay

Task-oriented instructions grouped by what the user wants to do.

**Sections:**

| Section | Header Color | Tasks |
|---------|-------------|-------|
| Cook & Reheat | Blue | Reheat, manual cook, power level, quick 30, keep warm |
| Auto & Defrost | Green | Sensor cook + food codes, defrost, popcorn |
| Clock & Timer | Brown | Set clock, kitchen timer |
| Controls | Red | Pause, cancel, child lock |

**Entry format:**
```html
<div class="ref-row">
  <div class="ref-label">
    <strong>Task name:</strong>
    <span class="btn-tag">Button</span> &rarr; <span class="btn-tag">Button</span>
    <span class="ref-desc">&mdash; short description.</span>
  </div>
</div>
```

**Rules:**
- One line per entry — task, buttons, description all on one line
- Bold task name first (e.g., "Reheat food:")
- Button names in `.btn-tag` pill boxes
- Arrows (`→`) show button sequence
- Description is inline after em dash, one short phrase
- If the device has food codes (sensor cook), show them in a flex-wrap grid:
  ```html
  <div class="ref-codes">
    <div class="ref-code"><strong>1</strong> Potato</div>
    ...
  </div>
  ```

### 5. Snap & Ask Artie Overlay

Mode selector with two large tappable cards:

```
┌────────────────────────────────┐
│  What do you want to check?    │
│                                │
│  ┌──────────────────────────┐  │
│  │ [pot icon]               │  │
│  │ Can I use this dish?     │  │
│  │ Take a photo of a bowl,  │  │
│  │ plate, container, or cup │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │ [broccoli icon]          │  │
│  │ What should I do with    │  │
│  │ this food?               │  │
│  │ Take a photo of food you │  │
│  │ want to cook or reheat   │  │
│  └──────────────────────────┘  │
│                                │
│  Photos are sent to Artie for  │
│  analysis and are not stored.  │
└────────────────────────────────┘
```

- Tapping a card opens the phone camera (`<input type="file" accept="image/*" capture="environment">`)
- Photo is resized to max 1024px, compressed to JPEG 0.7 quality
- Sent to Claude as base64 multimodal message via `/api/chat`
- Response shown in chat view

### 6. Care & Info Overlay

Reference information grouped into sections:

| Section | Header Color | Contents |
|---------|-------------|----------|
| Cleaning | Blue | Step-by-step cleaning for each part |
| Troubleshooting | Red | Common problems and solutions |
| Specifications | Green | Power, dimensions, weight, clearance |
| Replacement Parts | Amber (`#e6a000`) | Part numbers and order link |
| Official Manual | Grey (`#78909c`) | Link to manufacturer's support site |

**End with a disclaimer:**
```html
<div style="margin-top:16px; padding:12px; background:#fff8e1;
     border-left:4px solid #e6a000; border-radius:6px;
     font-size:13px; color:#5f6368;">
  This tool is intended as a helpful guide and may contain errors.
  Always refer to the official [Brand] owner's manual for complete
  and accurate information.
</div>
```

### 7. Chat View

Hidden by default. Shown when user types a question or sends a photo.

```
┌──────────────────────────────┐
│ ‹ Back                       │  ← returns to Home View
├──────────────────────────────┤
│                              │
│  [Assistant bubble]          │
│           [User bubble]      │
│  [Assistant bubble]          │
│                              │
├──────────────────────────────┤
│ Ask Artie anything about     │
│ your [device type]           │
│ ┌────────────────┐ [mic][▶] │
│ │ Ask Artie...   │           │
│ └────────────────┘           │
└──────────────────────────────┘
```

- Input bar is always visible (both Home and Chat views)
- Voice input via Web Speech API (mic button)
- Send button (orange circle)
- Assistant bubbles: white with border, left-aligned
- User bubbles: teal background, white text, right-aligned
- Typing indicator: "Thinking..." bubble with `role="status"`

### 8. Close/Back Buttons

All overlays use the same close button style:
- Teal pill button (`← Back`)
- `background: var(--teal)`, `color: white`
- `padding: 12px 20px`, `min-height: 44px`, `border-radius: 22px`
- `font-size: 15px`, `font-weight: 700`
- Escape key also closes the overlay
- Focus is trapped within the overlay (tab cycling)

---

## System Prompt Template

```
You are Artie, the ClearLabel assistant for the [Brand Model] [device type].

Your job is to help users — especially older adults and people who find
electronics confusing — understand how to use their [device type]. Always be
warm, patient, and encouraging. Never be condescending.

RULES:
- Give short, clear, numbered steps. Maximum 5 steps per answer.
- Use plain English. Say "press" not "actuate".
- When describing a button, say where it is on the panel.
- If the user seems frustrated or confused, acknowledge it warmly.
- Only answer questions about this [device type]. For anything else, say:
  "I'm only set up to help with this [Brand] [device type] — for other
  questions, a quick web search should help!"
- Never guess. If you don't know, say so and suggest the manual.
- Keep answers under 150 words.
- Your name is Artie.

PHOTO SAFETY:
- ONLY respond to photos of food, dishes, cookware, containers, or this device.
- If a photo is off-topic, respond ONLY with: "I can only help with food
  and cookware photos for your [device type]. Please send a picture of
  the food you want to cook or the dish you want to check!"
- Do NOT describe or comment on inappropriate images.

DEVICE INFO:
Model: [Brand Model]
Power: [Wattage]

PANEL LAYOUT:
[Map every button with its position]

FUNCTION REFERENCE:
[List every function with its button sequence and constraints]

SAFETY:
[List all safety rules from the manual]
```

### Photo Analysis Prompts

**Cookware check** — appended to system prompt when user sends a dish photo:
```
ADDITIONAL TASK: COOKWARE PHOTO ANALYSIS
The user sent a photo of a dish/container. Analyze microwave safety.

COOKWARE SAFETY KNOWLEDGE:
SAFE: [list from manual]
UNSAFE: [list from manual]
CAUTION: [list from manual]

RESPONSE FORMAT:
- Clear verdict: "Safe to use!", "Do NOT use this!", or "Use with caution"
- 2-3 short sentences explaining why
- If uncertain, suggest the container test: dish + 1 cup water, 1 min full power
- Under 100 words
```

**Food analysis** — appended when user sends a food photo:
```
ADDITIONAL TASK: FOOD PHOTO ANALYSIS
The user sent a photo of food to cook/reheat. Give specific instructions.

[Include sensor cook codes if the device has them]

RESPONSE FORMAT:
- Name what you see: "That looks like..."
- If it matches a preset program, give those instructions
- If not, give manual cook instructions with power and time
- Max 5 numbered steps
- Include safety warnings when relevant
- Under 150 words
```

---

## FAQ Database Template

Pre-populate the SQLite `faq` table with answers for these categories. Each answer must be written in Artie's voice (warm, concise, numbered steps, max 5 steps, under 150 words).

### Required FAQ Categories (~30-50 entries per device)

**Cooking & Reheating (6-8 entries)**
- How do I reheat food?
- How do I cook something manually?
- How do I add time while cooking? (if quick-start feature exists)
- How do I change the power level?
- How do I keep food warm? (if feature exists)
- How do I use stage/multi-stage cooking? (if feature exists)

**Auto Programs (4-6 entries)**
- How do I use [auto cook feature]?
- What are the [auto cook] codes/programs?
- How do I use [auto reheat feature]?
- What do the More/Less buttons do? (if applicable)

**Defrost (2-3 entries)**
- How do I defrost food?
- How do I defrost [common food]? (variant phrasing)

**Specialty (1-2 entries per feature)**
- How do I make popcorn? (if popcorn button exists)
- How do I use [any other specialty button]?

**Timer & Clock (2-3 entries)**
- How do I set the clock?
- How do I use the timer?
- How do I use delayed start? (if feature exists)

**Controls (3-4 entries)**
- How do I pause cooking?
- How do I cancel cooking?
- How do I use child lock? (if feature exists)
- What do the beeps mean?

**Safety (4-6 entries)**
- What containers are safe to use?
- Can I use metal/foil?
- Can I cook eggs?
- What foods need piercing?
- Add variants: "Is this bowl safe?", "Can I put foil in?"

**Cleaning (2-3 entries)**
- How do I clean the microwave?
- How do I clean the [removable part]?

**Troubleshooting (4-5 entries)**
- My microwave won't turn on
- My microwave won't start cooking
- [Removable part] is noisy/wobbling
- What does the lock icon mean?
- Steam on the door — is it normal?

**Specs & Parts (3-4 entries)**
- What are the dimensions?
- Where can I get replacement parts?
- Where is the user manual?
- What is the wattage? (variant phrasing)

**Common Variant Phrasings (6-8 extra entries)**
Add alternate phrasings for the most common questions. Map them to the same answers. Examples:
- "heat up leftovers" → same answer as "reheat food"
- "defrost chicken" → same answer as "defrost food"
- "how big is it" → same answer as "dimensions"
- "lock the microwave" → same answer as "child lock"

---

## File Naming Convention

```
public/
  [model-slug].html           — device page (e.g., panasonic-nn-sc73ls.html)
  [model-slug].jpg             — 400px product image
  [model-slug]-full.jpg        — 1200px+ product image
  mainlogo.png                 — shared Artie logo (same across all devices)

db/
  faq.db                       — shared SQLite database (all devices)
  seed-[brand].js              — seed script per brand/device
```

**Model slug format:** lowercase, hyphens, no spaces: `[brand]-[model]`
Examples: `panasonic-nn-sc73ls`, `samsung-me21r7051ss`, `lg-lmc2075st`

---

## Accessibility Requirements (WCAG 2.1 AA)

Every device page must meet:
- **Contrast:** 4.5:1 minimum for text, 3:1 for large text
- **Touch targets:** 44px minimum height/width for all buttons
- **Focus:** visible `outline` on all interactive elements
- **Focus trapping:** overlays trap Tab key cycling
- **Escape key:** closes any open overlay
- **Skip navigation:** link to jump to chat input
- **ARIA:** `role="dialog"`, `aria-modal="true"`, `aria-label` on overlays
- **Live region:** `aria-live="polite"` on chat messages container
- **No opacity-based text dimming** — use distinct color values instead

---

## Checklist for New Device

- [ ] Gather all required inputs from the manual
- [ ] Create product images (400px + 1200px+)
- [ ] Build HTML page following this layout template
- [ ] Write system prompt with complete function reference
- [ ] Write cookware and food photo analysis prompts
- [ ] Create FAQ seed script with 30-50 Q&A pairs
- [ ] Run seed script to populate `db/faq.db`
- [ ] Add `device_id` to server.js (or make it dynamic from URL)
- [ ] Test all overlays open/close and focus trapping
- [ ] Test chat with cached questions (FAQ hits)
- [ ] Test chat with uncached questions (API fallthrough)
- [ ] Test photo capture and analysis (both modes)
- [ ] Test on mobile Safari and Chrome
- [ ] Run accessibility audit
- [ ] Verify all content against the official manual

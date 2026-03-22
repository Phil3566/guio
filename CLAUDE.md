# ClearLabel — Project Context for Claude Code

> This file is read automatically by Claude Code at session start.
> Update it at the end of every session: what was built, what decisions
> were made, what to work on next.
> Last updated: March 2026

---

## What ClearLabel Is

An AI-powered platform that makes confusing consumer devices self-explanatory.
Users scan a QR code on a device (microwave, router, TV, printer, etc.), land
on a device-specific page, and can:

1. See a clear visual guide to every button and function
2. Chat with an AI assistant trained on the device manual
3. Follow step-by-step task guides (e.g. "How do I defrost chicken?")
4. Purchase a physical sticker kit for the device

The target customer is adults 65+ and their family members (35–55) who buy
devices as gifts and want to reduce "how do I use this?" support calls.

---

## Business Model

### Revenue streams (in priority order for launch)
1. **Physical sticker kits** — device-specific removable sticker sets, $12–$24,
   sold on Amazon FBA and via the website. This is the primary revenue driver.
2. **PDF downloads** — printable sticker sheets, $4–$8, ~95% margin.
3. **Manufacturer licensing** — sell to brands (e.g. Panasonic) to bundle with
   products. Pitch: reduces 1-star "confusing setup" reviews and support costs.
   Target price: $0.50–$2.00 per unit or $20k–$100k/year per model.
4. **Family subscription** — $4.99/month, covers unlimited devices for one
   household. Buyer is adult child, user is parent.
5. **B2B white-label** — license the full platform to retailers or care companies.

### AI chat cost model
- Provider (ClearLabel owner) pays the Anthropic API bill.
- End users pay nothing, need no account.
- Model: claude-haiku-4-5 for chat (~$0.01–$0.02 per user session of 5 msgs).
- Monetized indirectly via sticker kit upsell on the chat page.

---

## Prototype Goal (Current Phase)

Build a working web prototype of the AI chat guide for one device:
**Panasonic NN-SC73LS microwave**.

The prototype demonstrates the full user flow:
1. User scans QR code → lands on device page
2. Sees a visual panel diagram and function summary
3. Types a question → gets a plain-language answer from Claude
4. Sees a call-to-action to buy the sticker kit

### Tech stack
- **Frontend:** Single HTML file (HTML + CSS + JS, no framework)
- **AI:** Anthropic API called directly from the frontend via fetch
  (for prototype only — in production, route through a backend to hide API key)
- **Model:** `claude-haiku-4-5-20251001`
- **No build step, no login, no database** for prototype

### API call pattern
```javascript
const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
    "anthropic-version": "2023-06-01",
    "anthropic-dangerous-direct-browser-access": "true"
  },
  body: JSON.stringify({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: conversationHistory
  })
});
```

---

## Device: Panasonic NN-SC73LS

### Panel layout (from manual p.8, items 11–30)
```
[Door Release (11)] on left edge of panel

[Display Window (16)] — green LCD, shows 12:00

Row 1: [Popcorn(17)] [Sensor Reheat(18)] [Sensor Cook(19)] [Power Level(20)]
Row 2: [Turbo Defrost(21)] [Keep Warm(22)] [Quick 30(23)]

[7][8][9]  [MORE (24)]
[4][5][6]  [LESS (25)]
[1][2][3]  [TIMER (27)]
[0]        [CLOCK (28)]

[STOP / RESET (29) wide] [START (30) wide]
```

### Complete function reference (for system prompt)
| Function | How to use |
|---|---|
| Manual Cook | Enter time → Start. Full power (PL10) by default. |
| Stage Cook | Up to 3 stages before pressing Start. 2 beeps between stages, 5 at end. |
| Quick 30 | Each press = +30 sec at full power. Works during cooking too. |
| Power Level | Press repeatedly: PL10=full · PL7=reheat · PL6=dense · PL3=defrost · PL1=low |
| Sensor Reheat | Press → Start. Don't open door until 2 beeps. Not for bread/beverages/frozen. |
| Sensor Cook | Press until food # appears → Start. More/Less adjusts ±20% before Start. |
| Sensor Cook Codes | 1=Potato 2=Fresh veg 3=Frozen veg 4=Frozen pizza 5=Frozen entrée 6=Casserole 7=Ground meat 8=Lasagna 9=Soup 10=Rice 11=Pasta 12=Fish |
| More / Less | ±20% on sensor time. Press before Start. |
| Popcorn | 1×=3.5oz · 2×=3oz · 3×=1.75oz → Start. Stop at 2–3 sec between pops. |
| Keep Warm | Enter minutes (max 30) → Start. Cannot combine with sensor features. |
| Turbo Defrost | Enter weight in lbs (max 6 lbs) → Start. Turn food at 2 beeps. |
| Manual Defrost | Use PL3 + enter time manually. |
| Kitchen Timer | Timer → enter time → Start. Counts down, no heat. |
| Standing Time | After cooking: Timer → enter rest time → Start. |
| Delayed Start | Timer → set delay → set cook time/power → Start. |
| Clock | Clock → enter time → Clock again. 12-hour format. Oven won't start while colon blinks. |
| First-time Setup | On first plug-in: Start to choose oz/kg → Stop/Reset to confirm. One time only. |
| Stop / Reset | 1× = pause · 2× = cancel all |
| Child Lock | Lock: Start ×3 · Unlock: Stop/Reset ×3 (within 10 seconds) |
| Beeps | 1=accepted · 2=stage done or open door · 5=finished · none=try again |

### Safety rules (always include in responses)
- No metal, foil, or wire twist-ties inside
- Pierce potatoes, sausages, sealed pouches before cooking
- Never heat whole eggs (will explode)
- Keep 3" clearance on sides, 12" above

---

## System Prompt for AI Chat

```
You are the ClearLabel assistant for the Panasonic NN-SC73LS microwave oven.

Your job is to help users — especially older adults and people who find
electronics confusing — understand how to use their microwave. Always be
warm, patient, and encouraging. Never be condescending.

RULES:
- Give short, clear, numbered steps. Maximum 5 steps per answer.
- Use plain English. Say "press" not "actuate". Say "the green START button"
  not "initiate cooking sequence".
- When describing a button, say where it is on the panel
  (e.g. "the wide green START button at the bottom right").
- If the user seems frustrated or confused, acknowledge it warmly before
  answering.
- Only answer questions about this microwave. For anything else, say:
  "I'm only set up to help with this Panasonic microwave — for other
  questions, a quick web search should help!"
- Never guess. If you don't know, say so and suggest they check the manual
  at help.na.panasonic.com

DEVICE FACTS:
Model: Panasonic NN-SC73LS
Power: 1200W
[Include full function reference table from CLAUDE.md here at build time]
```

---

## QR Code

The QR code encodes: `https://clearlabel.com/device/panasonic-nn-sc73ls`

URL convention for the catalog: `clearlabel.com/device/[brand]-[model-slug]`
Example: `clearlabel.com/device/tp-link-archer-ax21`

The domain is not yet registered. For the prototype, use a placeholder URL
or localhost. The QR SVG path data is stored in `assets/qr_panasonic_nn_sc73ls.txt`
in the project folder.

---

## What Has Been Built (Pre-CLI Work)

All of the following were built and validated in the design phase:

### Sticker kit outputs
- `clearlabel_prototype.html` — full sticker sheet with all buttons
- `clearlabel_top_sticker_white.html` + `.pdf` — single top-of-microwave sticker
- `clearlabel_top_sticker_fr.html` + `.pdf` — French version
- `clearlabel_concise_white.html` + `.pdf` — concise version with front panel diagram
- `clearlabel_with_qr.html` + `.pdf` — version with QR code
- `clearlabel_v3.html` + `.pdf` — centred panel diagram, arrows in 4 directions, task list, QR

### PowerPoint outputs
- `clearlabel_quickref.pptx` — full quick reference slide with panel diagram + task list
- `clearlabel_text.pptx` — clean text-only reference following style guide
- `clearlabel_panel.pptx` — dark-mode panel recreation from manual p.8

### Business documents
- `CLEARLABEL_BUSINESS_PLAN.md` — full business plan
- `SKILL.md` — condensed skill file for Claude project context

---

## Device Categories to Expand Into

Priority order based on market research:
1. Electronics & home tech (TVs, routers, cable boxes, streaming sticks)
2. Medical & health devices (blood pressure monitors, CPAP, glucometers)
3. Home appliances (washers, dryers, microwaves) ← current focus
4. HVAC & smart home (thermostats, security panels)
5. Office & printing (printers, scanners)
6. Kitchen gadgets (Instant Pot, air fryers, espresso machines)

---

## Market Research Tools

- **Helium 10 Black Box** — find top electronics by monthly sales volume
  - Filter: 500+ monthly sales, 200+ reviews, under 4.2★, $20–$150 price
  - Low rating = confused users = ClearLabel opportunity
- **ImportYeti** (free) — US customs data, supplier country of origin
- **Amazon 1–3★ reviews** — mine for "confusing", "called my son", "no instructions"

---

## Key Decisions Made

| Date | Decision |
|---|---|
| Mar 2026 | Concept established — AI-generated sticker kits for confusing devices |
| Mar 2026 | Primary channel: Amazon FBA → own website |
| Mar 2026 | Hero product: physical sticker kit. PDF as high-margin complement |
| Mar 2026 | AI chat: provider bears API cost, monetized via sticker upsell + manufacturer deals |
| Mar 2026 | First prototype device: Panasonic NN-SC73LS microwave |
| Mar 2026 | Prototype stack: single HTML file, Anthropic API via fetch, claude-haiku-4-5 |
| Mar 2026 | QR URL convention: clearlabel.com/device/[brand]-[model-slug] |
| Mar 2026 | No user login for chat — open access, frictionless |
| Mar 2026 | Switched to Claude Code CLI for prototype build |

---

## Open Tasks

### Prototype (do first)
- [ ] Build `index.html` — device page with chat interface
- [ ] Write and test the system prompt with real user questions
- [ ] Add tappable panel diagram (SVG, each button shows tooltip/description)
- [ ] Add sticker kit upsell section below chat
- [ ] Test on mobile (primary use case — user is standing at microwave)

### Near-term
- [ ] Register domain: clearlabel.com (or clearlabel.co, getclrlabel.com)
- [ ] Run Helium 10 Black Box research to select 2nd and 3rd devices
- [ ] Find sticker print-on-demand supplier
- [ ] Create Amazon seller account and claim New Seller Incentives
  ($50 coupon credits + $200 ad credit + free Vine enrollment — expire 90 days)

### Later
- [ ] Build voice-guided mode (Web Speech API for TTS)
- [ ] "What do I want to do?" outcome-based selector
- [ ] Multi-device family subscription flow
- [ ] Manufacturer outreach deck

---

## How to Start Each Session

```
/init
```

Then say something like:
> "We're building the ClearLabel prototype. Read CLAUDE.md and let's continue
> where we left off."

At the end of each session, ask Claude to update the Open Tasks section
of this file.

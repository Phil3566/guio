# ClearLabel — Project Context for Claude Code

> This file is read automatically by Claude Code at session start.
> Update it at the end of every session: what was built, what decisions
> were made, what to work on next.
> Last updated: April 3, 2026

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

## Current Phase: Pre-Launch Hardening

### What's been built

**Four working device pages:**
1. `public/index.html` — Panasonic NN-SC73LS microwave (hero product)
2. `public/nespresso.html` — Nespresso Vertuo Next coffee machine
3. `public/emeril-airfryer.html` — Emeril Lagasse Dual Zone 360 Air Fryer
4. `public/pastigio-frame.html` — Pastigio Frameo 10.1" digital picture frame

Each device page includes:
- Interactive panel diagram with tappable buttons
- AI chat powered by Claude Haiku (via Express backend proxy)
- Quick Reference overlay with button descriptions
- FAQ caching for common questions (reduces API calls)
- QR codes for production URLs
- WCAG 2.1 AA accessibility compliance
- Mobile-first responsive design

**Pastigio-specific features:**
- 2x2 pastel card grid navigation (6 cards, no emojis/chevrons)
- Collapsible `[TECHNICAL]...[/TECHNICAL]` sections in AI chat responses (replaced tech level selector)
- Why People Love It overlay (5 sections from customer reviews, source note)
- Common Questions overlay (5 Q&A sections)
- Common Issues overlay (9 tappable issue cards, including SD Card Not Recognized)
- All overlays include disclaimer with link to official Frameo user manual
- Cross-references between overlays specify exact sub-section
- FAQ seed system for pre-cached hand-written answers

**Deployment:**
- GitHub repo: `Phil3566/guio` (origin/master)
- DigitalOcean: auto-deploys from GitHub master push

**Backend:**
- `server.js` — Express server on port 8080, proxies Anthropic API calls
- `lib/faq-cache.js` — SQLite-backed FAQ cache, session management, admin settings
- `.env` — stores `ANTHROPIC_API_KEY`, `ADMIN_KEY`

**Admin dashboard** (`/admin/stats?key=...`):
- Per-device stats filtering (device selector buttons)
- Summary cards: cache hits, API calls, hit rate, total Q&As, daily API calls remaining, sessions
- Adjustable settings form: IP rate limit, session creation rate, session request cap, fingerprint lifetime cap, daily API cap, session expiry minutes
- Settings stored in SQLite `settings` table, persist across restarts
- Resources management: view all curated resources grouped by topic, add new resources, delete resources
- Resource API: `GET/POST/DELETE /admin/resources` endpoints (admin-key protected)

**Market research pipeline:**
- `research/amazon_scanner.py` — scrapes Amazon Best Sellers, ranks by opportunity score
- `research/review_analyzer.py` — Playwright + Claude API automated review analysis
- `research/category_picks.csv` — 127 product categories, 39 selected for research
- `research/analysis_2026-03-30.csv` — full confusion analysis results across 35 categories

**Documentation:**
- `docs/microwave-layout-template.md` — standard layout template for microwave device pages

### Tech stack
- **Frontend:** Single HTML files (HTML + CSS + JS, no framework)
- **Backend:** Express.js proxy server (hides API key from browser)
- **AI:** Claude Haiku 4.5 via Anthropic API
- **Research:** Python + Playwright + Claude API for automated product analysis
- **Database:** SQLite via `better-sqlite3` — FAQ cache, sessions, daily stats, admin settings
- **No build step, no login required**

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

## What Has Been Built

### Device pages (CLI phase)
- `public/index.html` — Panasonic NN-SC73LS microwave: chat, panel diagram, Quick Reference, QR
- `public/nespresso.html` — Nespresso Vertuo Next: chat, panel diagram, Quick Reference, QR
- `public/emeril-airfryer.html` — Emeril Dual Zone 360: chat, 24 presets, dual-zone controls, QR
- `public/pastigio-frame.html` — Pastigio Frameo 10.1": chat, 6 overlays, tech level, 2x2 card grid, QR
- `server.js` — Express backend on port 8080, API proxy for Anthropic calls
- `docs/microwave-layout-template.md` — standard layout template for microwave device pages

### Documentation (Companion files)
- `LEGAL-REQUIREMENTS.md` — 29-area legal compliance audit for public web app with AI chat
- `GUARDRAILS.md` — security audit, 6 critical + 4 high + 5 medium vulnerabilities documented
- `USER-INTERFACE.md` — comprehensive UI guide across all 4 device pages
- `DEPLOYMENT.md` — deployment setup and instructions

### Research pipeline (CLI phase)
- `research/amazon_scanner.py` — Best Sellers scraper, opportunity scoring
- `research/review_analyzer.py` — Playwright + Claude API confusion analyzer
- `research/category_picks.csv` — 127 categories, 39 selected
- `research/product_research_template.csv` — pre-formatted research spreadsheet
- `research/README.md` — usage instructions for research tools

### Sticker kit outputs (pre-CLI)
- `clearlabel_prototype.html` — full sticker sheet with all buttons
- `clearlabel_top_sticker_white.html` + `.pdf` — single top-of-microwave sticker
- `clearlabel_top_sticker_fr.html` + `.pdf` — French version
- `clearlabel_concise_white.html` + `.pdf` — concise version with front panel diagram
- `clearlabel_with_qr.html` + `.pdf` — version with QR code
- `clearlabel_v3.html` + `.pdf` — centred panel diagram, arrows in 4 directions, task list, QR

### PowerPoint outputs (pre-CLI)
- `clearlabel_quickref.pptx` — full quick reference slide with panel diagram + task list
- `clearlabel_text.pptx` — clean text-only reference following style guide
- `clearlabel_panel.pptx` — dark-mode panel recreation from manual p.8

### Business documents (pre-CLI)
- `CLEARLABEL_BUSINESS_PLAN.md` — full business plan
- `SKILL.md` — condensed skill file for Claude project context

---

## Device Categories to Expand Into

Based on automated review analysis (see `research/analysis_2026-03-30.csv`):

### Top opportunities (confusion score 5+, ClearLabel fit: Yes)
1. **Digital picture frames (Frameo-powered)** — Very strong UX pain across all 5 questions. Gift setup failure is the #1 complaint: frames sit unused because 65+ recipients can't connect WiFi. One Frameo guide covers dozens of brands (BIGASUO, Akimart, Pastigio, Dragon Touch, YunQiDeer, Pexar). Best manufacturer licensing angle — Frameo hardware makers would pay to reduce 1-star "can't set up" reviews.
2. **Aura Carver Digital Picture Frame** — Very strong confusion evidence (all 5 UX questions). Proprietary software (not Frameo). Touch bar misfires, no pause/off button, arrives with no manual (just a QR code). Families travel to help elderly recipients set up.
3. **Emeril Lagasse Dual Zone 360 Air Fryer** — confusion 6/10, fit: Yes (already built)
4. **Cuisinart CBK-110 Bread Maker** — Strong evidence on 4 of 5 UX questions. Cuisinart confirmed their own instruction booklet was incorrect. Button confusion, unexpected behavior.
5. **TVs** — confusion 6/10, fit: Yes. Top pain point: setup, smart features, remote
6. **Printers** — confusion 5/10, fit: Yes. Setup, Wi-Fi connectivity, driver installation

### Categories researched (39 selected from 127)
Full list in `research/category_picks.csv`. Groups include:
- Kitchen (air fryers, espresso machines, food processors, etc.)
- Electronics (TVs, soundbars, routers, streaming sticks, etc.)
- Home (robot vacuums, sewing machines, garage door openers, etc.)
- Office (printers, label makers, shredders)
- Personal Care (hair clippers, electric toothbrushes, etc.)

### Digital Picture Frames — Deep Dive

**Frameo ecosystem (software platform, not a brand):**
Frameo licenses its app to third-party hardware manufacturers. One ClearLabel guide covers all of them.
- **Brands using Frameo:** BIGASUO, Akimart, Pastigio, Dragon Touch, YunQiDeer, Pexar (by Lexar), and many others
- **Common hardware:** 10.1" 1280x800 IPS, 16-32GB, 2.4GHz WiFi only, plastic build
- **Premium tier:** Pexar — 2K resolution, anti-glare, 64GB, rear gallery lighting
- **Key differentiators:** screen size, storage, anti-glare (Pexar only), 5GHz WiFi (BIGASUO 21.5" only)

**Aura Carver (separate ecosystem, proprietary software):**
- NOT compatible with Frameo
- Touch bar controls (misfires common), no physical pause/off button
- Arrives with no printed manual — just a QR code
- Very strong confusion evidence across all 5 UX questions

**Why frames are ideal for ClearLabel:**
- Perfect demographic overlap (65+ gift recipients)
- The #1 failure point is gift setup: frame sits unused because recipient can't connect WiFi
- QR code on gift box insert or frame back → "Just got this as a gift? Start here"
- Manufacturer licensing pitch: reduces 1-star "can't set up" reviews that kill conversion
- One Frameo guide = dozens of brands served

### Excluded categories
- **Medical/health devices** — liability risk if guide gives wrong info
- **Security devices** (smart locks, video doorbells) — liability if guide causes security failure

---

## Market Research Tools

### Custom-built (replaces Helium 10)

1. **`research/amazon_scanner.py`** — Amazon Best Sellers scraper
   - Scrapes product listings across configurable categories
   - Extracts: name, ASIN, price, rating, review count
   - Calculates opportunity score: `total_reviews * rating_multiplier` (lower rating = higher multiplier)
   - Outputs ranked CSV (`results_YYYY-MM-DD.csv`)
   - Dependencies: `requests`, `beautifulsoup4`

2. **`research/review_analyzer.py`** — Automated review confusion analyzer
   - Reads selected categories from `category_picks.csv`
   - Uses Playwright to load Amazon product pages (not review pages — those require login)
   - Extracts Amazon's AI-generated "Customers say" summary + on-page reviews
   - Sends to Claude Haiku for structured analysis: confusion score, setup difficulty,
     instruction quality, elderly mentions (all 0-10), plus pain points and ClearLabel fit
   - Outputs enriched CSV (`analysis_YYYY-MM-DD.csv`)
   - Dependencies: `playwright`, `requests`, `beautifulsoup4`, `anthropic` API key in `.env`
   - Known issue: ~13 categories return wrong products due to Amazon URL slug mismatches

### External (free)
- **Amazon Best Sellers pages** — direct browsing for category discovery
- **Amazon Rufus AI** — ask about common complaints and confusion signals
- **ImportYeti** (free) — US customs data, supplier country of origin

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
| Mar 2026 | Added Express.js backend (`server.js`) to proxy API calls (hides key from browser) |
| Mar 2026 | Built Panasonic microwave device page with chat, panel diagram, Quick Reference |
| Mar 2026 | Built Nespresso Vertuo Next as second device page |
| Mar 2026 | Added FAQ caching to reduce API calls for common questions |
| Mar 2026 | WCAG 2.1 AA accessibility pass on all device pages |
| Mar 2026 | QR codes updated for production URLs |
| Mar 2026 | Replaced Helium 10 ($99+/mo) with custom Python scraping tools (free) |
| Mar 2026 | Built automated review analyzer using Playwright + Claude API |
| Mar 2026 | Excluded medical/health and security device categories (liability risk) |
| Mar 2026 | Curated 127 product categories, selected 39 for research |
| Mar 2026 | TVs identified as top expansion opportunity (confusion score 6/10) |
| Mar 2026 | Amazon review pages require login — pivoted to product page scraping instead |
| Mar 2026 | API key stored in `.env`, read by both server.js and Python scripts |
| Mar 2026 | Deep-dive air fryer analysis: Cosori #1 seller scored 0 (too easy), Emeril Dual Zone scored 6/10 |
| Mar 2026 | Third device chosen: Emeril Lagasse Dual Zone 360 Air Fryer (ASIN B0BZ52FLKC, confusion 6/10) |
| Mar 2026 | Built Emeril air fryer device page with 24 presets, dual-zone controls, red/copper theme |
| Mar 2026 | Added `dotenv` to server.js — auto-loads API key from `.env` |
| Mar 2026 | QR code generated for Emeril page — fixed to GitHub Pages URL, pushed |
| Mar 2026 | Review analysis: Cuisinart CBK-110 bread maker — strong confusion on 4/5 UX questions |
| Mar 2026 | Review analysis: Aura Carver digital picture frame — very strong confusion on all 5 questions |
| Mar 2026 | Discovered Frameo ecosystem: software licensed to dozens of hardware brands (BIGASUO, Akimart, Pastigio, Dragon Touch, etc.) — one guide covers many brands |
| Mar 2026 | Digital picture frames chosen as next device category — strongest UX pain, perfect demographic, best licensing angle |
| Mar 2026 | Frameo-powered frames preferred over Aura Carver — one page covers dozens of brands vs. just one |
| Mar 2026 | Built Pastigio Frameo digital picture frame page with 6 overlays, chat, voice, tech level |
| Mar 2026 | Deployed to DigitalOcean — auto-deploys from GitHub master push |
| Mar 2026 | Converted Pastigio nav buttons from full-width gradient buttons to 2x2 pastel card grid |
| Mar 2026 | Reduced tech level selector from 7 locations to 2 (Common Questions + Common Issues only) |
| Mar 2026 | Updated pill labels from "Simple/Standard/Technical" to "Plain English/Some tech is fine/Full tech details" |
| Mar 2026 | Created LEGAL-REQUIREMENTS.md — 29-area legal compliance audit for public web app with AI chat |
| Mar 2026 | Updated GUARDRAILS.md — added model override vulnerability, 6 critical server-side fixes documented |
| Mar 2026 | Product images changed from .jpg to .png for Pastigio (source files were PNG format) |
| Apr 2026 | Admin dashboard redesigned: per-device stats filtering, adjustable rate limits/caps stored in SQLite settings table |
| Apr 2026 | Added `POST /admin/settings` endpoint — validates and saves 6 configurable settings, hot-swaps rate limiters |
| Apr 2026 | Added `GET /api/config` endpoint — serves non-sensitive settings (session timeout) to client |
| Apr 2026 | `pastigio-frame.html` session timeout now fetched dynamically from `/api/config` instead of hardcoded 30 min |
| Apr 2026 | `ADMIN_KEY` env var required on DigitalOcean for admin dashboard access (set to `rtfm-admin-2026`) |
| Apr 2026 | Removed tech level selector entirely — replaced with collapsible `[TECHNICAL]...[/TECHNICAL]` sections in AI responses |
| Apr 2026 | System prompt tone: direct, no apologies, explicit banned phrases list ("Great question!", "I understand that's frustrating", etc.) |
| Apr 2026 | Quick Start Guide overhauled: explicit (you, on the frame) / (them, on their phone) labels, merged duplicate sender sections |
| Apr 2026 | Quick Reference overhauled: all paths start with "tap the screen", new entries (multi-select, remove person, WiFi status), reordered sections |
| Apr 2026 | Cross-references between overlays now specify exact sub-section (e.g., "Common Issues → WiFi Won't Connect") |
| Apr 2026 | All overlays now include disclaimer linking to official Frameo user manual |
| Apr 2026 | FAQ seed system added to `faq-cache.js` — pre-caches hand-written answers, overwrites AI-generated ones on restart |
| Apr 2026 | Cleaned apologetic language from existing cached FAQ answers in DB |
| Apr 2026 | Added SD Card Not Recognized card to Common Issues overlay |
| Apr 2026 | iOS Safari text-size-adjust fix for rotation bug |
| Apr 2026 | "Why People Love It" nav card updated: "From actual customer reviews" + source note in overlay |
| Apr 2026 | Care & Info overlay overhauled: all Settings paths start with "tap the screen", specified eye icon location, added router restart instructions, clarified SD card import, added Frameo+ pricing variability note |
| Apr 2026 | Common Issues: added "Frame Won't Turn On" and "Frame Frozen / Not Responding" cards (11 total) |
| Apr 2026 | Final sweep of all cached FAQ answers — cleaned remaining apologetic/filler language (IDs 215, 497, 502, 548, 564, 565) |
| Apr 2026 | Added WiFi won't connect seed to `_seedFAQs()` — exact match for Common Issues card question, guarantees cache hit |
| Apr 2026 | Key learning: Common Issues cards send specific question text; if similarity score is below threshold (0.45), it falls through to live API which may generate apologetic responses. Seeds with exact card question text prevent this. |
| Apr 2026 | Curated resources system: `resources` table in SQLite, `_seedResources()` for wifi_connect topic (3 videos, 2 articles, 3 support links, 2 search fallbacks), `topic` column on `faq` table, frontend renders collapsible `<details>` sections |
| Apr 2026 | Admin dashboard: added Resources management section — view/add/delete resources via `GET/POST/DELETE /admin/resources` endpoints, `getAllResources()`, `addResource()`, `deleteResource()` methods in faq-cache.js |
| Apr 2026 | Fixed: FAQ cache check now runs before session validation — stale session tokens no longer block cached answers |
| Apr 2026 | WiFi answer rewritten using Frameo support articles — added WPA3, hidden SSID, band steering/mesh, channel width, client isolation, MAC filtering, phone hotspot diagnostic. 5 main steps + expanded TECHNICAL section |
| Apr 2026 | WiFi answer wording: "When you see the list of WiFi networks on the frame", "you or someone familiar with routers", "weak signal can cause the connection to fail", cross-reference to resource videos/articles |
| Apr 2026 | Resource links: YouTube opens in new tab ("close the tab to come back"), articles/support open in same tab ("swipe from the left edge to come back"). Toast notification before navigation (17px, 4s duration) |
| Apr 2026 | "Click for Technical details" label color changed from orange to blue (#1565c0) to match resource sections |
| Apr 2026 | Rebranded to Artie Manual — owl logo, hero text references QR sticker, admin dashboard renamed |
| Apr 2026 | Hero simplified: removed product image/fullscreen overlay, centered "Digital Picture Frame AI User Manual" text, removed chat input title bar |
| Apr 2026 | Off-topic questions now blocked before API call — zero cost canned response, runs before session validation |
| Apr 2026 | Added 12 hand-written FAQ seeds: SD card, WiFi, broken glass, videos, sideways photo, storage full, remote control, captions, tablet, WiFi status, icons, multi-frame |
| Apr 2026 | Admin dashboard: merged "Never-Hit Seed Questions" into "All Cached Q&A" section — browse all entries with expandable answers |
| Apr 2026 | QR sticker print page updated with Artie Manual owl logo alongside QR code |

---

## Open Tasks

### Prototype — completed
- [x] Build `index.html` — Panasonic microwave device page with chat
- [x] Write and test the system prompt with real user questions
- [x] Add tappable panel diagram (SVG, each button shows tooltip/description)
- [x] Add Quick Reference overlay
- [x] Add Express.js backend to proxy API calls
- [x] Build second device page (`nespresso.html`)
- [x] FAQ caching for common questions
- [x] WCAG 2.1 AA accessibility compliance
- [x] QR codes for production URLs

### Market research — completed
- [x] Build Amazon Best Sellers scraper (`amazon_scanner.py`)
- [x] Curate 127 product categories across 9 groups
- [x] Select 39 categories for automated analysis
- [x] Build automated review analyzer (`review_analyzer.py`)
- [x] Run full analysis across 35 categories — results in `analysis_2026-03-30.csv`
- [x] Identify TVs as top expansion opportunity
- [x] Deep-dive air fryer analysis (Cosori too easy, Emeril Dual Zone = best candidate)
- [x] Fixed air fryer Best Sellers URL in `category_picks.csv`

### Emeril air fryer page — completed
- [x] Build `emeril-airfryer.html` — 1,360 lines, 4 overlays, chat, voice, 24 presets
- [x] Quick Reference: Air Fry & Cook, Bake & Roast, Special Functions, Dual Zone & Sync
- [x] Button Guide: Zone controls, center controls (Sync/Shake/Light/Mute), display colors
- [x] Care & Info: cleaning, troubleshooting (Er1-Er4), specs, accessories, support contacts
- [x] Snap & Ask: "Can I put this in the air fryer?" + "How should I cook this?"
- [x] System prompt covers all 24 presets, dual zone, QuickSync, Toast darkness mode
- [x] QR code SVG generated (`qr-emeril.svg` + `qr-emeril-print.html`)
- [x] Added `dotenv` to server.js for auto API key loading
- [x] Pushed to GitHub
- [x] QR code URL fixed — now points to GitHub Pages live URL
- [ ] Add product images (`emeril-airfryer.jpg` + `emeril-airfryer-full.jpg`)
- [ ] Verify preset default temps against physical manual (some are approximate)

### Review research (from separate Claude session)
- [x] Cuisinart CBK-110 bread maker — analyzed, strong confusion signals
- [x] Aura Carver digital picture frame — analyzed, very strong confusion across all 5 questions
- [x] Frameo ecosystem mapped — software platform licensed to dozens of hardware brands
- [x] Identified "gift setup failure" as the #1 pain point for digital frames
- [ ] Import research files to `research/` folder: `cuisinart_review_analysis.md`, `aura_carver_review_analysis.md`, `Aura_Carver_Full_Manual.md`

### Pastigio Frameo digital picture frame page — completed
- [x] Chose Pastigio as the Frameo-powered frame to build for
- [x] Built `public/pastigio-frame.html` — 6 overlays, chat, voice, tech level selector, 8 common issues
- [x] Quick Start Guide: gift setup, WiFi, friend codes, first photo
- [x] Quick Reference: photos, slideshow, display, albums, videos
- [x] Why People Love It: 5 themed sections from 3,465 Amazon reviews
- [x] Common Questions: 5 themed Q&A sections from Amazon reviews
- [x] Common Issues: 8 tappable issue cards that pre-fill chat
- [x] Care & Info: troubleshooting, WiFi, backup, Frameo+, specs
- [x] QR code generated (`qr-pastigio.svg` + `qr-pastigio-print.html`)
- [x] Product image added (`pastigio-frame.png` + `pastigio-frame-full.png`)
- [x] Deployed to DigitalOcean (auto-deploys from GitHub master)
- [x] Nav buttons converted to 2x2 pastel card grid (6 cards, no emojis)
- [x] Tech level selector reduced from 7 locations to 2 (Common Questions + Common Issues only)
- [x] Pill labels updated: "Plain English" / "Some tech is fine" / "Full tech details"

### Pastigio content & tone overhaul — completed
- [x] Removed tech level selector — replaced with collapsible `[TECHNICAL]...[/TECHNICAL]` in AI responses
- [x] System prompt: direct tone, banned apologetic phrases, no filler
- [x] Quick Start Guide: explicit device labels (you/on the frame, them/on their phone), merged duplicate sender sections
- [x] Quick Reference: all Settings/My Photos paths start with "tap the screen", added multi-select, remove person, WiFi status entries
- [x] Quick Reference reordered: Loading Photos before Albums & Organize
- [x] Cross-references specify exact sub-section (Common Issues → WiFi Won't Connect, etc.)
- [x] All overlays include disclaimer with link to official Frameo user manual
- [x] "Why People Love It" updated: source note from customer reviews, removed dementia reference
- [x] FAQ seed system: `_seedFAQs()` in faq-cache.js pre-caches hand-written answers, overwrites AI-generated ones
- [x] SD Card Not Recognized card added to Common Issues
- [x] iOS Safari text-size-adjust rotation fix
- [x] Cleaned apologetic language from cached FAQ answers in DB
- [x] Common Questions overhauled: consistent "people" language (not "family"), added delete photos and slideshow speed questions
- [x] Cross-references throughout all overlays: Quick Start, Quick Reference, Common Questions, Common Issues, Care & Info all interlinked
- [x] Frameo+ pricing note added: "pricing may vary — check the Frameo app"
- [x] Care & Info overlay overhauled: Settings paths, eye icon location, router restart instructions, SD card import, Frameo+ pricing note, Amazon support path
- [x] Common Issues: added "Frame Won't Turn On" and "Frame Frozen / Not Responding" cards (11 total)
- [x] Final sweep of all cached FAQ answers — cleaned remaining apologetic/filler language

### Admin dashboard — completed
- [x] Added `settings` table to SQLite schema in `faq-cache.js`
- [x] Added `getSetting()`, `setSetting()`, `getAllSettings()` methods
- [x] `checkLimits()` reads session cap and fingerprint cap from settings table (no longer hardcoded)
- [x] `getStats()` and `getRecentRequests()` accept optional device filter
- [x] Rate limiters built from DB settings with hot-swap on save (wrapper middleware pattern)
- [x] Daily API cap reads from settings table (falls back to `DAILY_API_LIMIT` env var)
- [x] `GET /api/config` — public endpoint returning `session_timeout_minutes`
- [x] `POST /admin/settings` — admin-key protected, validates 6 settings with min/max bounds
- [x] Dashboard HTML: device selector buttons, "Daily Left" card, settings form with save button
- [x] `pastigio-frame.html` fetches session timeout dynamically from `/api/config`
- [x] Resources management: `getAllResources()`, `addResource()`, `deleteResource()` in faq-cache.js
- [x] Resource API: `GET/POST/DELETE /admin/resources` endpoints (admin-key protected, validates category)
- [x] Dashboard Resources section: table grouped by topic, delete buttons, Add Resource form (device, topic, category, title, URL, order)
- [x] Pushed to GitHub / deployed to DigitalOcean

### Also next
- [ ] Add sticker kit upsell section to device pages
- [ ] Add product images to Emeril page
- [ ] Implement server-side guardrails (see Companion files/GUARDRAILS.md)

### Near-term
- [ ] Register domain: clearlabel.com (or clearlabel.co, getclrlabel.com)
- [ ] Find sticker/label print supplier (Sticker Mule, StickerGiant, Lightning Labels for Amazon FBA)
- [ ] Create Amazon seller account and claim New Seller Incentives
  ($50 coupon credits + $200 ad credit + free Vine enrollment — expire 90 days)

### Later
- [ ] Build Aura Carver device page (separate from Frameo — proprietary software)
- [ ] Build Cuisinart CBK-110 bread maker device page
- [ ] Build voice-guided mode (Web Speech API for TTS)
- [ ] "What do I want to do?" outcome-based selector
- [ ] Multi-device family subscription flow
- [ ] Manufacturer outreach deck — pitch to Frameo hardware brands

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

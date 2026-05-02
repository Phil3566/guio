# ClearLabel — Project Context for Claude Code

> This file is read automatically by Claude Code at session start.
> Update it at the end of every session: what was built, what decisions
> were made, what to work on next.
> Last updated: April 26, 2026 (USPTO trademark filed — Serial 99787815, sticker samples ordered from StickerGiant)

---

## Companion Files (read on demand — don't load all at once)

| Area | File | What's in it |
|---|---|---|
| Business plan | `../Companion files/business/CLEARLABEL_BUSINESS_PLAN.md` | Full business plan, revenue model, market sizing |
| Amazon launch | `../Companion files/business/AMAZON-LAUNCH.md` | FBA setup, listing strategy, launch checklist |
| LLC formation | `../Companion files/business/LLC-FORMATION.md` | Entity setup steps and status |
| Collateral | `../Companion files/business/Collateral.md` | Marketing materials and assets |
| Skill file | `../Companion files/business/SKILL.md` | Condensed project context for Claude projects |
| Frameo support | `../Companion files/Frameo/Frameo_Support_Articles.md` | Official Frameo help articles (WiFi, setup, etc.) |
| Pastigio reviews | `../Companion files/Frameo/PASTIGIO-REVIEW-SUMMARY.md` | Amazon review analysis for Pastigio frame |
| Sticker optimization | `../Companion files/research/STICKER-OPTIMIZATION.md` | How many sticker designs, phased rollout, validation plan |
| Legal requirements | `../Companion files/legal/LEGAL-REQUIREMENTS.md` | 29-area legal compliance audit |
| Compliance status | `../Companion files/legal/COMPLIANCE-STATUS.md` | Current compliance progress |
| Caching & guardrails | `../Companion files/technical/CACHING-AND-GUARDRAILS.md` | Security audit, rate limiting, vulnerabilities |
| Deployment | `../Companion files/technical/DEPLOYMENT.md` | DigitalOcean setup and deploy instructions |
| UI guide | `../Companion files/technical/USER-INTERFACE.md` | Comprehensive UI guide across all device pages |
| Aura Carver manual | `../Companion files/research/Aura_Carver_Full_Manual.md` | Full device manual (future device page) |
| Aura Carver reviews | `../Companion files/research/aura_carver_review_analysis.md` | Review confusion analysis |
| Cuisinart reviews | `../Companion files/research/cuisinart_review_analysis.md` | Review confusion analysis |
| Pastigio 10.1" specs | `../Companion files/Pastigio/10p1inchers.docx` | Amazon product specs for all Pastigio 10.1" ASINs |
| Todo list | `../TODO.md` | Master task list |

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
1. **Frameo Setup Kit** — QR sticker + laminated quick-start card + port labels,
   **$12.99** single / **$19.99** 2-pack on Amazon FBA. COGS ~$2.00, profit
   ~$5.18/unit (or ~$3.23 after ads in Year 1). Core revenue driver.
2. **PDF downloads** — printable guide, **$4.99** on own website, ~95% margin.
3. **Manufacturer licensing** — QR sticker in-box, **$0.75/unit** to brands
   (Pastigio, Akimart, BIGASUO). ~$124K/year at 15,300 frames/mo. Near-passive.
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
- `research/frameo_catalog.py` — Frameo frame discovery, spec extraction, QR sticker clustering
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

**Frameo ecosystem (software-only platform, NOT a hardware brand):**
Frameo licenses its app to third-party hardware manufacturers. Frameo does not make frames. One Artie Manual guide covers all Frameo-powered frames with the same hardware profile.
- **Confirmed Frameo brands:** Akimart, BIGASUO, Pastigio, YunQiDeer, Pexar (by Lexar), and many others
- **NOT Frameo (despite similar listings):** Dragon Touch (own app), Uhale/WONNIE (own app), Aura Carver (proprietary)
- **Common hardware:** 10.1" 1280x800 IPS, 16-32GB, 2.4GHz WiFi only, plastic build
- **Premium tier:** Pexar — 2K resolution, anti-glare, 64GB, rear gallery lighting
- **Key differentiators:** screen size, storage, anti-glare (Pexar only), 5GHz WiFi (BIGASUO 21.5" only)
- **Note:** Many sellers use "FRAMEO" or "Frameo" as their Amazon brand name even though they are white-label manufacturers (e.g., the #5 best seller branded "FRAMEO" is actually Akimart)

**Amazon Best Sellers research (April 2026):**
12 of the top 30 Digital Picture Frames on Amazon are Frameo-powered. Top Frameo sellers by monthly volume:

| Rank | Brand (actual) | Size | Bought/mo | Reviews | ASIN |
|------|---------------|------|-----------|---------|------|
| #5 | Akimart (listed as "FRAMEO") | 10.1" | 4K+ | 10,104 | B083SH697H |
| #6 | Pastigio (listed as "Frameo") | 10.1" | 3K+ (lead ASIN; 4,150–4,500+ combined across 16 ASINs) | 2,170 | B0D41ZMYB2 |
| #9 | BIGASUO | 10.1" | 2K+ | 9,035 | B088NHSVJN |
| #10 | Pastigio | 15.6" | 2K+ | 3,117 | B0CQN2PKQR |

**QR sticker strategy (see `Companion files/research/STICKER-OPTIMIZATION.md` for full analysis):**

**Two OEM factories confirmed via FCC filings (April 7, 2026):**
- **SSA Electronic** (FCC 2A4D2) → Akimart, BIGASUO, YunQiDeer, ~18 brands
- **Somy Technology** (FCC 2AFW7) → Pastigio, FLYRUIT

Pastigio and Akimart have identical specs on paper but **different PCBs from different factories** — likely need separate sticker designs.

| Phase | Design | OEM | ASINs | Est. Sales/mo |
|-------|--------|-----|-------|--------------|
| 1 (launch) | SSA 10.1" | SSA (ZN-DP1002) | ~42 | 6,000+ |
| 1 (launch) | Somy 10.1" | Somy (M10R7 platform) | 16 | 4,150–4,500+ |
| 1 (launch) | 15.6" (verify OEM split) | Mixed | ~21 | 3,000+ |
| 2 | SSA 21.5" XL | SSA (ZN-DP2101) | 6 | low |
| 2 | SSA 8" Compact | SSA (ZN-DP8002) | 4 | low |

**Critical validation before print**: Compare Pastigio 10.1" (Somy) vs Akimart 10.1" (SSA) back panels — expect different layouts. Then compare Pastigio 15.6" (Somy M15R2) vs BIGASUO 15.6" (likely SSA ZN-DP1501) to determine if 15.6" also needs an OEM split.

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

3. **`research/frameo_catalog.py`** — Frameo frame cataloger and QR sticker clustering
   - Three-phase pipeline: Discovery → Spec Extraction → Clustering
   - **Phase 1 (Discovery):** Searches Amazon with 6 generic queries + 29 brand-specific queries, deduplicates ASINs, filters out accessories/non-frames
   - **Phase 2 (Spec Extraction):** Opens each product page with Playwright, extracts title/bullets/spec table/A+ content, sends to Claude Haiku to normalize 19 hardware fields + sales data (bought/month, BSR rank, review count, rating)
   - **Phase 3 (Clustering):** Groups frames by screen size class, WiFi bands, port set, button layout, battery, and special features. Assigns cluster IDs to determine how many distinct QR code stickers are needed
   - **Checkpoint/resume:** Saves progress to `frameo_progress.json` after each ASIN — can resume if interrupted
   - **Flags:** `--skip-discovery` (reuse cached ASINs), `--skip-specs` (reuse cached specs)
   - **Output:** `frameo_catalog_YYYY-MM-DD.csv` with cluster assignments + console summary
   - Dependencies: `playwright`, `requests`, `beautifulsoup4`, `anthropic` API key in `.env`
   - Usage: `cd research && python frameo_catalog.py`
   - Known issue: Amazon aggressively blocks Playwright on product pages (~45% return insufficient data). Mobile viewport helps. May need multiple runs or manual ASIN additions via `MANUAL_ASINS` list at top of script.
   - First run (April 2026): discovered 211 ASINs, 108 extracted, 10 confirmed Frameo. Low confirmation rate due to Amazon blocking — the Best Sellers page scrape (separate Playwright run) was more reliable for identifying top sellers.

### External (free)
- **Amazon Best Sellers pages** — direct browsing for category discovery. The Digital Picture Frames Best Sellers page (`/zgbs/electronics/525460`) is the most reliable way to find top-selling Frameo frames. Load with Playwright using a mobile viewport for best results.
- **Keepa** (free browser extension) — BSR history graphs on every Amazon product page, shows sales trends over time
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
| Apr 2026 | Added 12 hand-written FAQ seeds: SD card, WiFi, broken glass, videos, sideways photo, storage full, remote control, captions, tablet, WiFi status, icons, multi-frame (later expanded to 22) |
| Apr 2026 | Admin dashboard: merged "Never-Hit Seed Questions" into "All Cached Q&A" section — browse all entries with expandable answers |
| Apr 2026 | QR sticker print page updated with Artie Manual owl logo alongside QR code |
| Apr 2026 | Systematic Common Issues FAQ improvement: searched Google for each question, compared to cached answer, identified gaps, wrote improved seeds with exact card question text, updated related DB entries |
| Apr 2026 | Improved FAQ seeds added: power warning/unplug, touch screen not responding, video sound at night, SD card not recognized (improved), frame won't turn on, frame frozen — 22 seeds total |
| Apr 2026 | Seed answer pattern established: answer the question first (reassure the user), then provide detailed steps and edge cases |
| Apr 2026 | All power-related answers now consistent: 10-minute unplug wait, 15-second power button hold, unplug both ends, factory reset pinhole details, photo recovery info (senders' phones still have originals) |
| Apr 2026 | Rebranded remaining "RTFM For Me" references: privacy.html, terms.html, pastigio-frame.html footer, server.js CORS origin — all now "Artie Manual" / artiemanual.com. "Ollie" → "Artie" in legal pages. |
| Apr 2026 | UI polish: hero title enlarged to 22px bold with responsive scaling (`min(22px, 5vw)`, `white-space: nowrap`), emojis added to all 6 nav cards and overlay titles, Quick Start header simplified to "START HERE" |
| Apr 2026 | Added root redirect: `server.js` now redirects `/` to `/pastigio-frame.html` (fixed "Cannot GET /" error on desktop) |
| Apr 2026 | Added `/app` redirect: `server.js` routes `owlxplain.com/app` → `https://onelink.to/ztmhrw` (Frameo app universal download link, detects iOS vs Android) |
| Apr 2026 | Quick Start rewritten from firsthand M10R7 unboxing: 9-step setup (stand, power, update, language, WiFi, time zone, firmware, setup as new, name/location), physical setup details (foot slot location, screw holes for H/V, edge power port) |
| Apr 2026 | "Add People" section reordered: friend downloads app first (Step 1), then owner generates code on frame. Renamed to "Adding People to the Frame". |
| Apr 2026 | Copy-to-clipboard invite message: inline "Copy invite message" link in Step 1, copies ready-made text with owlxplain.com/app download link + toast confirmation |
| Apr 2026 | Optional self-send: blue info box after setup steps tells frame owner how to download the app themselves if they also want to send photos |
| Apr 2026 | WiFi requirement softened: "Must be 2.4GHz" → "May require 2.4GHz depending on your model" (some models have dual-band) |
| Apr 2026 | Frameo manual disclaimer link now shows toast ("Opening in a new tab — close it to come back") before navigating |
| Apr 2026 | Quick Reference: inline SVG icons added for Settings (gear), WiFi, Power, Moon, Hide (eye), Delete (trash+X), Fill/Fit (arrows), Add friend (person+), My Photos (3x3 grid), Adjust (wrench+photo) — all icon names bolded |
| Apr 2026 | Quick Reference: removed "Select multiple photos" entry and "Landscape photos look best" line; changed React to "send an emoji"; Slideshow default "may vary" |
| Apr 2026 | SD card corrected to Micro SD for M10R7 — tappable image tooltip shows Micro SD card photo popup (reusable `showImageTooltip()` function) |
| Apr 2026 | Cross-reference scroll-to-highlight: Common Issues cards now have IDs, `openCommonIssues(targetId)` scrolls to and highlights the target card with 3s brand-colored outline |
| Apr 2026 | All 5 overlay headers standardized: "OFFICIAL FRAMEO USER MANUAL" (all caps, hyperlinked with toast), full disclaimer, QR re-scan note |
| Apr 2026 | Known gap: AI chat doesn't know M10R7 uses Micro SD — needs system prompt update in `lib/system-prompts.js` + FAQ seed (saved for dedicated pass) |
| Apr 2026 | Built `frameo_catalog.py` — 3-phase pipeline: discovery (Amazon search), spec extraction (Playwright + Claude), clustering (rule-based grouping for QR sticker count) |
| Apr 2026 | Frameo is software-only, NOT a hardware brand. Amazon sellers use "FRAMEO" as brand name but are white-label manufacturers |
| Apr 2026 | Dragon Touch and Uhale/WONNIE confirmed NOT Frameo — they use their own apps |
| Apr 2026 | Best Sellers research: Akimart (#5, 4K+/mo), Pastigio (#6 10.1" 3K+/mo, #10 15.6" 2K+/mo), BIGASUO (#9, 2K+/mo) are the top Frameo sellers |
| Apr 2026 | QR sticker strategy revised: start with 3 designs (SSA 10.1" + Somy 10.1" + 15.6") — SSA and Somy have different PCBs/back panels |
| Apr 2026 | Companion files directory added to CLAUDE.md — 16 files indexed with paths and descriptions for on-demand loading |
| Apr 2026 | SSA model mapping completed: `research/ssa_model_mapping.csv` — 96 ASINs, 21 brands, 8 SSA hardware groups |
| Apr 2026 | Manufacturer partnership strategy documented in business plan — brands first (Pastigio → Akimart/BIGASUO), factory (SSA) second after proof |
| Apr 2026 | Aftermarket IP risk assessed — Section 6a added to LEGAL-REQUIREMENTS.md: nominative fair use, Amazon takedown risk, C&D risk, protective measures |
| Apr 2026 | Sticker optimization analysis: launch with 2 designs (10.1" + 15.6") covering ~85% of market, expand to 4–5 later. Full analysis in `STICKER-OPTIMIZATION.md` |
| Apr 2026 | ZN-DP8001 added to SSA mapping — 10.1" battery model (5000mAh), NOT 8". "80" prefix = battery line. Akimart/iYooker brand, B0DKNTPP54, ~$100. |
| Apr 2026 | Pastigio 10.1" deep dive: 4 models (M10R5, M10R7, M10R8, ZC002), 9 ASINs. M10R5 uses OurPhoto (not Frameo) — excluded. M10R8 has 5 active keyword-variant listings. ZC002 is the flagship with MUSE design award. CSV updated from 2 to 9 Pastigio 10.1" entries. |
| Apr 2026 | **MAJOR CORRECTION — Pastigio is NOT SSA hardware.** FCC filings confirm Pastigio is made by Shenzhen Somy Technology (FCC 2AFW7), not SSA Electronic (FCC 2A4D2). Different PCBs, different factories. FLYRUIT also confirmed as Somy hardware. Sticker count revised from 2 to 3 at launch (SSA 10.1" + Somy 10.1" + 15.6" TBD). CSV column renamed from `ssa_model` to `oem_model`. |
| Apr 2026 | Pastigio 10.1" deep dive: 17 ASINs cataloged (16 active Frameo, 1 OurPhoto excluded). 3 model families: ZC002 (Micro SD), M10R8 (Full Size SD), M10R7 (original). Parent ASIN B0DB8BTVYJ consolidates ~11 children. |
| Apr 2026 | SD card type difference discovered: ZC002 uses Micro SD, M10R8 uses Full Size SD. Same PCB per FCC but different port — handle with conditional note in guide, not separate sticker. |
| Apr 2026 | Combined Pastigio 10.1" volume: 4,150–4,500+/mo across 16 active Frameo ASINs. Lead ASIN B0D41ZMYB2 = 3,000+. Caveat: may overlap with child ASIN counts. |
| Apr 2026 | CSV expanded to 22 columns: added model_number, color, frame_material, sd_card_type, wall_mount, app, parent_asin, status. 113 rows total. |
| Apr 2026 | B08TWZN2TP (Pastigio M10R5) confirmed NOT Frameo — uses OurPhoto app. Excluded from sticker coverage. |
| Apr 2026 | ~~Frameo Setup Kit pricing: $12.99 single, $19.99 2-pack, $4.99 PDF. COGS ~$2.00.~~ **Superseded** — product simplified to sticker-only (see below). |
| Apr 2026 | ~~Kit contents: QR sticker + laminated quick-start card (4x6) + port label strip.~~ **Superseded** — laminated card and port labels removed. |
| Apr 2026 | **Product pivot: sticker-only.** Laminated card removed — gets lost. Sticker stays on device permanently. COGS drops from ~$2.00 to ~$0.25. |
| Apr 2026 | **Tiered pricing by frame size:** $5.99 (10.1"), $8.99 (15.6"), $9.99 (21.5"). Price = 6–15% of frame price. Larger frames subsidize thinner 10.1" margins. Blended profit: $2.89/unit. |
| Apr 2026 | **FBA required from day one.** Sticker must arrive same day as frame (Prime 1-day). FBM delivery days later = useless. FBA fee (≤2oz): $3.06/unit. |
| Apr 2026 | Thin margins ($1.78 on 10.1") are strategic moat — deters competitors from entering the market. |
| Apr 2026 | Rebranded from "Artie Manual" to "Owlxplain" — ARTIE registered in Classes 9/42 by Artie, Inc. New name: Owlxplain (owl + explain). Mascot "Artie" kept. |
| Apr 2026 | Owlxplain, LLC filed in California (Doc B20260169375). EIN obtained. Domain owlxplain.com registered. |
| Apr 2026 | All code updated: server.js CORS, pastigio-frame.html, privacy.html, terms.html, system-prompts.js — all now Owlxplain / owlxplain.com. |
| Apr 2026 | Operating Agreement created for Owlxplain, LLC. Stored in Companion files/business/. |
| Apr 2026 | Profit projections modeled: Y1 Pastigio-only $15K–$27K, Y1 expanded $45K, Y2 full Frameo $109K, Y2+B2B $233K, Y3 $300K–$450K |
| Apr 2026 | B2B licensing: $0.75/unit, ~$124K/year passive profit at 15,300 frames/mo across 4+ brands. Stacks with aftermarket Amazon sales. |
| Apr 2026 | Attachment rate is the critical unknown — 3% conservative, 7% moderate, 12% optimistic. No direct precedent for this product category. |
| Apr 2026 | LLC-FORMATION.md expanded: added Operating Agreement template, liability shield maintenance rules, tax filing requirements (Schedule C, Form 568, 3522), SE tax note, Amazon Brand Registry section, status tracker, recommended order of operations |
| Apr 2026 | AMAZON-LAUNCH.md rewritten for Artie Manual: $12.99 kit/$19.99 2-pack pricing, 6 ASIN association mechanisms (listing copy, Sponsored Products ASIN targeting, FBT, Posts, A+ Content, Sponsored Brands), top 5 ASINs to target, nominative fair use rules, launch sequence, startup costs $660–$1,060 |
| Apr 2026 | Trademark search: "ARTIE" registered in Classes 9 and 42 by Artie, Inc. (AI avatar/VR software) — blocking conflict for "Artie Manual" name |
| Apr 2026 | Rebranded from Artie Manual to **Owlxplain** — domain owlxplain.com registered, DNS configured at Porkbun, added to DigitalOcean App Platform, 301 redirects from artiemanual.com and rtfmforme.app |
| Apr 2026 | Updated all code references: server.js CORS origin, privacy.html, terms.html, pastigio-frame.html title, system-prompts.js, admin dashboard, qr-pastigio-print.html — all now "Owlxplain" / owlxplain.com. Mascot still named "Artie" (the owl character, not the brand). |
| Apr 2026 | Amazon Seller Central account submitted (April 24) — Professional plan ($39.99/mo), identity verified via video call, pending document re-verification (Articles of Organization + bank statement rejected, needs resubmission) |
| Apr 2026 | GS1 GTIN purchased (April 25) — GTIN 199874844824 for 10.1" sticker, GS1 Account #30395137, bought at store.gs1us.org ($30 single GTIN) |
| Apr 2026 | Schwab business bank account application submitted (April 24) — Schwab One Brokerage Account for Non-Incorporated Organizations, additional docs requested (W-9 with SSN, handwritten signatures, title "Member", occupation) |
| Apr 2026 | EIN confirmed from IRS Notice CP575G — EIN 42-1797315, dated April 8, 2026 |
| Apr 2026 | Sticker samples ordered from StickerGiant — kiss cut, BOPP material, matte finish, permanent adhesive, 4"x2" size |
| Apr 2026 | USPTO trademark filed (April 26) — "Owlxplain" Standard Character Mark, Class 9, Section 1(a) Use in Commerce, Serial 99787815, $350. Filed at teas.uspto.gov, identity verified via ID.me. Specimen: screenshot of owlxplain.com. Signatory: Philippe Sochoux, Member. |
| Apr 2026 | Trademark enables Amazon Brand Registry enrollment with pending serial number — unlocks A+ Content, Vine, Sponsored Brands, Brand Store |

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

### Frameo catalog research — mostly complete
- [x] Built `frameo_catalog.py` — discovery, spec extraction, QR clustering pipeline
- [x] First run: discovered 211 ASINs, 108 specs extracted, 10 confirmed Frameo
- [x] Best Sellers page scrape: identified top Frameo sellers (Akimart, Pastigio, BIGASUO)
- [x] Confirmed Dragon Touch and Uhale/WONNIE are NOT Frameo
- [x] SSA model mapping completed: `research/ssa_model_mapping.csv` — 113 ASINs, 21 brands, 10 hardware groups, 22 columns
- [x] Sticker optimization analysis: 3 designs at launch (SSA 10.1" + Somy 10.1" + 15.6"), 4–5 at scale — see `STICKER-OPTIMIZATION.md`
- [x] Manufacturer partnership strategy: brands first (Pastigio → Akimart/BIGASUO), SSA factory second
- [x] Aftermarket IP risk assessed: nominative fair use, Amazon takedown mitigation, C&D response plan
- [x] Pastigio 10.1" deep dive: 17 ASINs cataloged (16 active Frameo), 3 model families, SD card difference, combined volume 4,150–4,500+/mo
- [x] CSV enriched with color, frame_material, sd_card_type, wall_mount, app, parent_asin, model_number, status columns
- [x] B08TWZN2TP confirmed OurPhoto (not Frameo) — excluded
- [ ] **Physical validation**: buy Akimart 10.1" (B083SH697H, ~$50) and compare back panel to Pastigio 10.1" — confirm different layout (SSA vs Somy)
- [ ] **Physical validation**: compare Pastigio 15.6" to BIGASUO 15.6" back panel (if budget allows)
- [ ] Confirm model numbers for 5 unassigned Pastigio ASINs: B0GC6C9195, B0FX3WFRN7, B0FX3Y8GPG, B0FX3X4Z5B, B0GC94VXZJ
- [ ] Verify B0GC6C9195 (Glossy Black, $89.99) — may be 64GB/WUXGA premium variant
- [ ] Confirm B0FMXSFN5G and B0FX3X4Z5B status (not in current parent groups — delisted?)
- [ ] Re-run spec extraction with sales data fields (bought/mo, BSR, reviews, rating) — run `python frameo_catalog.py --skip-discovery`
- [ ] Add top-seller ASINs to `MANUAL_ASINS` in `frameo_catalog.py` for guaranteed extraction

### Quick Start guide rewrite (from M10R7 unboxing) — completed
- [x] Added `/app` redirect to `server.js` → `https://onelink.to/ztmhrw`
- [x] Rewrote START HERE: 9-step setup flow based on firsthand unboxing (stand, power, update, language, WiFi, time zone, firmware, setup as new, name/location)
- [x] Physical details: foot slot location, two screw holes (H/V), edge power port, wall outlet
- [x] Rewrote "Adding People to the Frame": friend downloads app first, inline "Copy invite message" link, `copyInviteMessage()` JS function
- [x] Added optional self-send step (Step 1) with tappable owlxplain.com/app link
- [x] WiFi requirement softened to "May require 2.4GHz" for dual-band models
- [x] Frameo manual disclaimer link shows toast before opening new tab
- [x] Add friend icon embedded as inline SVG (from user-provided screenshot)

### Quick Reference polish — completed
- [x] Inline SVG icons: Settings (gear), WiFi, Power, Moon, Hide (eye), Delete (trash+X), Fill/Fit, Add friend, My Photos (3x3 grid), Adjust (wrench+photo)
- [x] All icon names bolded (Hide, Delete, Power, Moon, Settings)
- [x] React changed to "send an emoji"; Slideshow "default may vary"
- [x] Removed "Select multiple photos" entry and "Landscape photos look best"
- [x] SD card → Micro SD card with tappable image tooltip popup (`showImageTooltip()`)
- [x] Cross-reference links to Common Issues now scroll to and highlight target card (3s outline)
- [x] All 11 Common Issues cards have IDs for cross-referencing
- [x] All 5 overlay headers: "OFFICIAL FRAMEO USER MANUAL" (all caps), full disclaimer + QR re-scan note
- [x] All overlay manual links have toast before opening new tab
- [ ] **Dedicated pass needed**: AI chat system prompt doesn't know M10R7 uses Micro SD — fix `lib/system-prompts.js` + add FAQ seed

### Also next
- [ ] Add sticker kit upsell section to device pages
- [ ] Add product images to Emeril page
- [ ] Implement server-side guardrails (see Companion files/GUARDRAILS.md)

### Business setup — in progress
- [x] File Owlxplain, LLC in California (Doc B20260169375, April 8, 2026)
- [x] Obtain EIN from IRS (42-1797315, April 8, 2026)
- [x] Register domain owlxplain.com (Porkbun, April 8, 2026)
- [x] Submit Amazon Seller Central account (April 24, 2026 — pending re-verification of documents)
- [x] Purchase GS1 GTIN for 10.1" sticker (199874844824, April 25, 2026)
- [x] Order sticker samples from StickerGiant (kiss cut, 4"x2", matte BOPP, April 26, 2026)
- [x] File USPTO trademark — "Owlxplain" Serial 99787815, Class 9, $350 (April 26, 2026)
- [ ] Resubmit Amazon seller verification documents (Articles of Organization + bank statement)
- [ ] Complete Schwab business bank account (W-9 + signatures resubmitted, waiting for approval)
- [ ] Enroll in Amazon Brand Registry with serial number 99787815
- [ ] Sign and store Operating Agreement
- [ ] File Statement of Information (LLC-12) — due by July 7, 2026
- [ ] Test sticker samples when they arrive (scan QR, check adhesive residue on frame)

### Near-term
- [ ] Design 3 QR sticker variants: SSA 10.1" + Somy 10.1" + 15.6" (pending physical validation — see Frameo catalog research tasks)
- [ ] Take product photos for Amazon listing (sticker on white background, sticker on frame, phone scanning QR)
- [ ] Order poly bags for FBA packaging
- [ ] Design and print backer cards (Vistaprint, ~$20–40 for 500)

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

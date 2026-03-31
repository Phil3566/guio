#!/usr/bin/env python3
"""
ClearLabel Review Analyzer — Playwright + Claude API

For each selected category in category_picks.csv:
1. Scrapes the Amazon Best Sellers page to find the #1 product
2. Opens the product page with Playwright to extract:
   - Amazon's AI-generated "Customers say" summary
   - Star breakdown (% per star)
   - On-page review text (mix of positive and negative)
3. Sends everything to Claude for ClearLabel opportunity analysis

Usage:
    python review_analyzer.py

Prerequisites:
    pip install playwright requests beautifulsoup4 anthropic
    playwright install chromium
"""

import csv
import os
import re
import sys
import time
import random
import logging
from datetime import date

try:
    from playwright.sync_api import sync_playwright
    import anthropic
    import requests
    from bs4 import BeautifulSoup
except ImportError as e:
    print(f"\nMissing dependency: {e}")
    print("Install with:")
    print("  pip install playwright requests beautifulsoup4 anthropic")
    print("  playwright install chromium\n")
    sys.exit(1)


# ─── CONFIGURATION ───────────────────────────────────────────────────────────

# Delay between page loads (seconds)
MIN_DELAY = 3.0
MAX_DELAY = 6.0

# Claude model for analysis
CLAUDE_MODEL = "claude-haiku-4-5-20251001"

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CATEGORY_FILE = os.path.join(SCRIPT_DIR, "category_picks.csv")

# ─── LOGGING ─────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("analyzer")

# ─── USER AGENTS ─────────────────────────────────────────────────────────────

USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15",
]

# ─── HELPERS ─────────────────────────────────────────────────────────────────

def load_selected_categories():
    """Read category_picks.csv and return rows where include=Y."""
    if not os.path.exists(CATEGORY_FILE):
        print(f"Category file not found: {CATEGORY_FILE}")
        sys.exit(1)

    selected = []
    with open(CATEGORY_FILE, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get("include", "").strip().upper() == "Y":
                selected.append(row)

    return selected


def extract_asin(url):
    match = re.search(r"/dp/([A-Z0-9]{10})", url)
    return match.group(1) if match else None


def clean_text(text):
    return re.sub(r"\s+", " ", text).strip()


def get_top_product(bestsellers_path, subcategory):
    """Scrape Amazon Best Sellers page and return the #1 product."""
    slug = subcategory.replace(" ", "-").replace("&", "and").replace("/", "-")
    slug = re.sub(r"[^a-zA-Z0-9-]", "", slug)
    url = f"https://www.amazon.com/Best-Sellers-{slug}/{bestsellers_path}"

    time.sleep(random.uniform(2.0, 4.0))

    resp = requests.get(url, headers={
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }, timeout=15)

    if resp.status_code != 200:
        return None, None, None, None

    if "captcha" in resp.text.lower() or "robot" in resp.text.lower()[:2000]:
        return None, None, None, None

    soup = BeautifulSoup(resp.text, "html.parser")

    for item in soup.select("[data-asin]"):
        asin = item.get("data-asin", "")
        if not asin:
            link = item.select_one('a[href*="/dp/"]')
            if link:
                asin = extract_asin(link.get("href", ""))
        if not asin:
            continue

        name_el = (
            item.select_one("[class*='line-clamp']") or
            item.select_one(".a-link-normal span") or
            item.select_one("a span")
        )
        name = clean_text(name_el.get_text()) if name_el else "Unknown"
        if len(name) < 5:
            continue

        rating_el = item.select_one("span.a-icon-alt")
        rating = rating_el.get_text().strip() if rating_el else ""

        review_el = item.select_one("span.a-size-small")
        review_count = review_el.get_text().strip() if review_el else ""

        return name[:120], asin, rating, review_count

    return None, None, None, None


def fetch_product_page_data(browser, asin):
    """
    Use Playwright to open a product page and extract:
    - Amazon's AI "Customers say" summary
    - Star breakdown
    - On-page review text
    """
    url = f"https://www.amazon.com/dp/{asin}"
    page = browser.new_page()
    data = {"customers_say": "", "star_breakdown": "", "reviews": [], "raw_text": ""}

    try:
        time.sleep(random.uniform(MIN_DELAY, MAX_DELAY))
        page.goto(url, wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(6000)

        title = page.title()
        if "Sign-In" in title:
            log.warning("    Sign-in redirect — skipping")
            return data

        body_text = page.inner_text("body")

        # 1. Extract "Customers say" AI summary
        idx = body_text.find("Customers say")
        if idx >= 0:
            # Grab text from "Customers say" to "AI Generated" marker
            end_marker = body_text.find("AI Generated", idx)
            if end_marker > idx:
                data["customers_say"] = body_text[idx:end_marker].strip()
            else:
                data["customers_say"] = body_text[idx:idx + 800].strip()

        # 2. Extract star breakdown
        star_parts = []
        for stars in ["5 star", "4 star", "3 star", "2 star", "1 star"]:
            idx_s = body_text.find(stars)
            if idx_s >= 0:
                snippet = body_text[idx_s:idx_s + 20]
                pct_match = re.search(r"(\d+%)", snippet)
                if pct_match:
                    star_parts.append(f"{stars}: {pct_match.group(1)}")
        data["star_breakdown"] = ", ".join(star_parts)

        # 3. Extract on-page reviews
        review_els = page.query_selector_all("[data-hook='review']")
        for r_el in review_els[:10]:
            # Get star rating
            star_el = r_el.query_selector("[data-hook='review-star-rating'] span")
            stars = ""
            if star_el:
                stars_text = star_el.inner_text()
                match = re.search(r"([\d.]+)", stars_text)
                if match:
                    stars = match.group(1)

            # Get review body
            body_el = r_el.query_selector("[data-hook='review-body'] span")
            body = body_el.inner_text().strip()[:500] if body_el else ""

            if body and len(body) > 20:
                data["reviews"].append({"stars": stars, "text": body})

        # Build combined raw text for Claude
        parts = []
        if data["customers_say"]:
            parts.append(f"AMAZON AI SUMMARY:\n{data['customers_say']}")
        if data["star_breakdown"]:
            parts.append(f"STAR BREAKDOWN: {data['star_breakdown']}")
        if data["reviews"]:
            parts.append("ON-PAGE REVIEWS:")
            for j, rev in enumerate(data["reviews"]):
                parts.append(f"  Review {j+1} ({rev['stars']} stars): {rev['text']}")
        data["raw_text"] = "\n\n".join(parts)

    except Exception as e:
        log.warning(f"    Playwright error: {e}")
    finally:
        page.close()

    return data


def analyze_with_claude(client, product_name, subcategory, product_data):
    """Send product page data to Claude for ClearLabel opportunity analysis."""
    prompt = f"""Analyze this Amazon product data for: {product_name}
Category: {subcategory}

Your job: determine if this product has USABILITY problems that a simplified instruction guide (sticker kit + AI chat assistant) could solve.

Rate each 0-10 (0=no evidence, 10=overwhelming evidence in the data):
1. CONFUSION_SCORE: How confused are users by controls, menus, settings, or features?
2. SETUP_DIFFICULTY: How hard is initial setup or installation?
3. INSTRUCTION_QUALITY: How bad are the included instructions or manual?
4. ELDERLY_GIFT_MENTIONS: Do reviewers mention buying for parents, grandparents, seniors, or as gifts?

Then provide:
- TOP_PAIN_POINTS: The 3 most specific usability complaints (one short line each)
- CLEARLABEL_FIT: Would a simplified sticker guide + AI assistant help? (Yes / Maybe / No)
- GUIDE_TOPICS: What the guide should cover (2-3 bullet points)

IMPORTANT: Base ratings ONLY on evidence in the data below. If there's no evidence, score 0.

Format your response EXACTLY like this:
CONFUSION_SCORE: [0-10]
SETUP_DIFFICULTY: [0-10]
INSTRUCTION_QUALITY: [0-10]
ELDERLY_GIFT_MENTIONS: [0-10]
TOP_PAIN_POINTS: [point 1] | [point 2] | [point 3]
CLEARLABEL_FIT: [Yes/Maybe/No]
GUIDE_TOPICS: [topic 1] | [topic 2] | [topic 3]

PRODUCT DATA:

{product_data}"""

    try:
        response = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text
    except Exception as e:
        log.warning(f"    Claude API error: {e}")
        return None


def parse_claude_response(text):
    """Parse Claude's structured response into a dict."""
    result = {
        "confusion_score": "",
        "setup_difficulty": "",
        "instruction_quality": "",
        "elderly_gift_mentions": "",
        "top_pain_points": "",
        "clearlabel_fit": "",
        "guide_topics": "",
    }

    if not text:
        return result

    for line in text.strip().split("\n"):
        line = line.strip()
        key_map = {
            "CONFUSION_SCORE:": "confusion_score",
            "SETUP_DIFFICULTY:": "setup_difficulty",
            "INSTRUCTION_QUALITY:": "instruction_quality",
            "ELDERLY_GIFT_MENTIONS:": "elderly_gift_mentions",
            "TOP_PAIN_POINTS:": "top_pain_points",
            "CLEARLABEL_FIT:": "clearlabel_fit",
            "GUIDE_TOPICS:": "guide_topics",
        }
        for prefix, key in key_map.items():
            if line.startswith(prefix):
                val = line.split(":", 1)[1].strip()
                if key in ("top_pain_points", "clearlabel_fit", "guide_topics"):
                    result[key] = val
                else:
                    match = re.search(r"\d+", val)
                    result[key] = match.group() if match else ""
                break

    return result


# ─── MAIN ────────────────────────────────────────────────────────────────────

def main():
    # Check API key — try env var first, then .env file in project root
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        env_file = os.path.join(SCRIPT_DIR, "..", ".env")
        if os.path.exists(env_file):
            with open(env_file) as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("ANTHROPIC_API_KEY="):
                        api_key = line.split("=", 1)[1].strip().strip('"').strip("'")
                        break
    if not api_key:
        print("\nError: ANTHROPIC_API_KEY not found.")
        print("Either:")
        print("  1. Run: export ANTHROPIC_API_KEY=sk-ant-...")
        print("  2. Or add ANTHROPIC_API_KEY=sk-ant-... to ../.env\n")
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)

    # Load selected categories
    categories = load_selected_categories()
    if not categories:
        print(f"\nNo categories selected. Open {CATEGORY_FILE}")
        print("and put 'Y' in the 'include' column for categories to scan.\n")
        sys.exit(1)

    print()
    print("=" * 60)
    print("  ClearLabel Review Analyzer")
    print("  Playwright + Claude API")
    print("=" * 60)
    print(f"  Categories to analyze: {len(categories)}")
    print(f"  Claude model: {CLAUDE_MODEL}")
    print(f"  Estimated time: ~{len(categories) * 0.5:.0f} minutes")
    print()

    results = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        for i, cat in enumerate(categories):
            subcategory = cat["subcategory"]
            path = cat["amazon_bestsellers_path"]

            log.info(f"[{i+1}/{len(categories)}] {subcategory}")

            # Step 1: Get the #1 product from Best Sellers
            log.info(f"  Finding #1 Best Seller...")
            product_name, asin, rating, review_count = get_top_product(path, subcategory)

            if not asin:
                log.warning(f"  Could not find #1 product — skipping")
                results.append({
                    "category": cat["category"],
                    "subcategory": subcategory,
                    "product_name": "FAILED TO FETCH",
                    "asin": "", "rating": "", "review_count": "",
                    "customers_say": "", "star_breakdown": "",
                    "reviews_on_page": 0,
                    "confusion_score": "", "setup_difficulty": "",
                    "instruction_quality": "", "elderly_gift_mentions": "",
                    "top_pain_points": "", "clearlabel_fit": "",
                    "guide_topics": "", "product_url": "",
                })
                continue

            log.info(f"  #1: {product_name[:55]}... ({rating}, {review_count} reviews)")

            # Step 2: Fetch product page data with Playwright
            log.info(f"  Loading product page...")
            page_data = fetch_product_page_data(browser, asin)
            log.info(
                f"  Got: {'AI summary' if page_data['customers_say'] else 'no summary'}, "
                f"{len(page_data['reviews'])} reviews"
            )

            # Step 3: Send to Claude for analysis
            analysis = {}
            if page_data["raw_text"]:
                log.info(f"  Analyzing with Claude...")
                raw_response = analyze_with_claude(
                    client, product_name, subcategory, page_data["raw_text"]
                )
                analysis = parse_claude_response(raw_response)
                log.info(
                    f"  -> Confusion: {analysis.get('confusion_score', '?')}/10 | "
                    f"Fit: {analysis.get('clearlabel_fit', '?')}"
                )
            else:
                log.warning(f"  No data extracted — skipping analysis")

            results.append({
                "category": cat["category"],
                "subcategory": subcategory,
                "product_name": product_name,
                "asin": asin,
                "rating": rating,
                "review_count": review_count,
                "customers_say": page_data["customers_say"][:300],
                "star_breakdown": page_data["star_breakdown"],
                "reviews_on_page": len(page_data["reviews"]),
                "confusion_score": analysis.get("confusion_score", ""),
                "setup_difficulty": analysis.get("setup_difficulty", ""),
                "instruction_quality": analysis.get("instruction_quality", ""),
                "elderly_gift_mentions": analysis.get("elderly_gift_mentions", ""),
                "top_pain_points": analysis.get("top_pain_points", ""),
                "clearlabel_fit": analysis.get("clearlabel_fit", ""),
                "guide_topics": analysis.get("guide_topics", ""),
                "product_url": f"https://www.amazon.com/dp/{asin}",
            })

        browser.close()

    # Sort by confusion score (highest first)
    def sort_key(r):
        try:
            return int(r.get("confusion_score", 0))
        except (ValueError, TypeError):
            return 0

    results.sort(key=sort_key, reverse=True)

    # Write CSV
    output_file = os.path.join(SCRIPT_DIR, f"analysis_{date.today().isoformat()}.csv")

    fieldnames = [
        "category", "subcategory", "product_name", "asin",
        "rating", "review_count", "star_breakdown",
        "reviews_on_page", "confusion_score", "setup_difficulty",
        "instruction_quality", "elderly_gift_mentions", "clearlabel_fit",
        "top_pain_points", "guide_topics",
        "customers_say", "product_url",
    ]

    with open(output_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in results:
            writer.writerow(r)

    # Print summary
    print(f"\n{'='*60}")
    print(f"  DONE!")
    print(f"  Categories analyzed: {len(results)}")
    print(f"  Results: {output_file}")
    print(f"{'='*60}")

    print(f"\n  TOP CLEARLABEL OPPORTUNITIES (by confusion score):\n")
    print(f"  {'Conf':<6} {'Setup':<7} {'Fit':<8} {'Category':<28} {'Product'}")
    print(f"  {'─'*5} {'─'*6} {'─'*7} {'─'*27} {'─'*35}")

    for r in results[:15]:
        conf = r.get("confusion_score", "-")
        setup = r.get("setup_difficulty", "-")
        fit = r.get("clearlabel_fit", "-")[:7]
        print(
            f"  {conf:<6} {setup:<7} {fit:<8} "
            f"{r['subcategory'][:27]:<28} "
            f"{r['product_name'][:35]}"
        )

    print(f"\n  Open {os.path.basename(output_file)} in Google Sheets for the full report.\n")


if __name__ == "__main__":
    main()

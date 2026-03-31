#!/usr/bin/env python3
"""
ClearLabel Amazon Product Research Scanner

Scrapes Amazon Best Sellers pages to find popular products, then ranks them
by ClearLabel opportunity (high volume + low rating = confused users).

Generates a CSV with direct links to 1-3 star reviews so you can quickly
spot-check for confusion keywords.

Usage:
    pip install requests beautifulsoup4
    python amazon_scanner.py

Edit the CATEGORIES dict below to add your target categories.
Find URLs at: https://www.amazon.com/bestsellers
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
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("\nMissing dependencies. Install them with:")
    print("  pip install requests beautifulsoup4\n")
    sys.exit(1)


# ─── CONFIGURATION ───────────────────────────────────────────────────────────

# Edit this dict: add Amazon Best Sellers category URLs you want to scan.
# To find URLs:
#   1. Go to https://www.amazon.com/bestsellers
#   2. Click into a category (e.g., Electronics > Television & Video)
#   3. Copy the URL from your browser
CATEGORIES = {
    "Microwave Ovens": "https://www.amazon.com/Best-Sellers-Microwave-Ovens/zgbs/kitchen/289935",
    "Printers": "https://www.amazon.com/Best-Sellers-Printers/zgbs/office-products/172648",
    "TVs": "https://www.amazon.com/Best-Sellers-TVs/zgbs/electronics/172659",
    "Routers": "https://www.amazon.com/Best-Sellers-Routers/zgbs/pc/300189",
    "Blood Pressure Monitors": "https://www.amazon.com/Best-Sellers-Blood-Pressure-Monitors/zgbs/hpc/3777171",
    "Air Fryers": "https://www.amazon.com/Best-Sellers-Air-Fryers/zgbs/kitchen/14286381",
}

# How many products to scan per category (max ~50 per page)
MAX_PRODUCTS_PER_CATEGORY = 30

# Delay between requests (seconds) — be respectful
MIN_DELAY = 2.0
MAX_DELAY = 4.5

# Output file
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))

# ─── USER AGENTS ─────────────────────────────────────────────────────────────

USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
]

# ─── LOGGING ─────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("scanner")

# ─── HELPERS ─────────────────────────────────────────────────────────────────

request_count = 0


def polite_get(url, max_retries=2):
    """Fetch a URL with rate limiting, random UA, and retry logic."""
    global request_count

    for attempt in range(max_retries):
        delay = random.uniform(MIN_DELAY, MAX_DELAY)
        time.sleep(delay)

        headers = {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate",
            "Connection": "keep-alive",
        }

        try:
            resp = requests.get(url, headers=headers, timeout=15)
            request_count += 1

            if resp.status_code == 200:
                # Check for CAPTCHA
                if "captcha" in resp.text.lower() or "robot" in resp.text.lower()[:2000]:
                    log.warning("  CAPTCHA detected — skipping this page")
                    return None
                return resp

            if resp.status_code == 503:
                log.warning(f"  503 (attempt {attempt + 1}/{max_retries}) — waiting longer...")
                time.sleep(random.uniform(5, 10))
                continue

            log.warning(f"  HTTP {resp.status_code} for {url[:80]}")
            return None

        except requests.RequestException as e:
            log.warning(f"  Request error: {e}")
            if attempt < max_retries - 1:
                time.sleep(random.uniform(3, 6))

    return None


def extract_asin(url):
    """Pull ASIN from an Amazon product URL."""
    match = re.search(r"/dp/([A-Z0-9]{10})", url)
    if match:
        return match.group(1)
    match = re.search(r"/product/([A-Z0-9]{10})", url)
    if match:
        return match.group(1)
    return None


def clean_text(text):
    """Normalize whitespace in text."""
    return re.sub(r"\s+", " ", text).strip()


# ─── SCORING ─────────────────────────────────────────────────────────────────

def calculate_opportunity_score(product):
    """
    ClearLabel Opportunity Score — rates products by confusion potential.

    Formula:
        score = total_reviews * confusion_multiplier

    confusion_multiplier is based on how far below 4.5 the rating is:
        4.5+  → 0.5x  (well-liked, less opportunity)
        4.0   → 1.0x  (decent ratings but still some complaints)
        3.5   → 1.5x  (notable dissatisfaction)
        3.0   → 2.0x  (high frustration)
        <3.0  → 2.5x  (very frustrated users)

    High volume + low rating = high opportunity.
    """
    total_reviews = product.get("total_reviews", 0)
    rating = product.get("rating", 0.0)

    if total_reviews == 0:
        return 0.0, 0

    # Rating-based multiplier: lower rating = more confused users
    if rating == 0:
        multiplier = 1.0  # No rating data — neutral
    elif rating >= 4.5:
        multiplier = 0.5
    elif rating >= 4.0:
        multiplier = 1.0
    elif rating >= 3.5:
        multiplier = 1.5
    elif rating >= 3.0:
        multiplier = 2.0
    else:
        multiplier = 2.5

    # Estimate percentage of 1-3 star reviews from overall rating
    # Rough heuristic: 5.0→0%, 4.5→10%, 4.0→20%, 3.5→35%, 3.0→50%
    if rating >= 4.5:
        low_star_pct = 0.10
    elif rating >= 4.0:
        low_star_pct = 0.20
    elif rating >= 3.5:
        low_star_pct = 0.35
    elif rating >= 3.0:
        low_star_pct = 0.50
    elif rating > 0:
        low_star_pct = 0.65
    else:
        low_star_pct = 0.25

    estimated_low_reviews = int(total_reviews * low_star_pct)

    score = total_reviews * multiplier

    return round(score, 0), estimated_low_reviews


# ─── SCRAPING ────────────────────────────────────────────────────────────────

def scrape_bestsellers(category_name, category_url):
    """Scrape an Amazon Best Sellers page for product listings."""
    log.info(f"\n{'='*60}")
    log.info(f"Category: {category_name}")
    log.info(f"URL: {category_url}")
    log.info(f"{'='*60}")

    resp = polite_get(category_url)
    if not resp:
        log.warning(f"  Could not fetch Best Sellers page for {category_name}")
        return []

    soup = BeautifulSoup(resp.text, "html.parser")
    products = []

    # Amazon Best Sellers use various layouts — try multiple selectors
    items = soup.select("[data-asin]")
    if not items:
        items = soup.select(".zg-item-immersion")
    if not items:
        items = soup.select('a[href*="/dp/"]')

    log.info(f"  Found {len(items)} raw items on page")

    seen_asins = set()

    for item in items:
        if len(products) >= MAX_PRODUCTS_PER_CATEGORY:
            break

        # Extract ASIN
        asin = item.get("data-asin", "")
        if not asin:
            link = item.select_one('a[href*="/dp/"]')
            if link:
                asin = extract_asin(link.get("href", ""))
            if not asin:
                asin = extract_asin(item.get("href", ""))

        if not asin or asin in seen_asins:
            continue
        seen_asins.add(asin)

        # Extract product name
        name_el = (
            item.select_one(".zg-text-center-align") or
            item.select_one("._cDEzb_p13n-sc-css-line-clamp-3_g3dy1") or
            item.select_one("[class*='line-clamp']") or
            item.select_one(".a-link-normal span") or
            item.select_one("span.a-text-normal") or
            item.select_one("a span")
        )
        name = clean_text(name_el.get_text()) if name_el else "Unknown Product"

        if len(name) < 5:
            continue

        # Extract rating
        rating_el = item.select_one("span.a-icon-alt")
        rating = 0.0
        if rating_el:
            match = re.search(r"([\d.]+)\s*out of", rating_el.get_text())
            if match:
                rating = float(match.group(1))

        # Extract review count
        review_el = (
            item.select_one("span.a-size-small") or
            item.select_one("a[href*='#customerReviews']")
        )
        review_count = 0
        if review_el:
            text = review_el.get_text().replace(",", "")
            match = re.search(r"([\d,]+)", text)
            if match:
                review_count = int(match.group(1).replace(",", ""))

        # Extract price
        price_el = (
            item.select_one(".a-price .a-offscreen") or
            item.select_one("span.p13n-sc-price")
        )
        price = ""
        if price_el:
            price = clean_text(price_el.get_text())

        # Calculate score
        score, estimated_low = calculate_opportunity_score({
            "total_reviews": review_count,
            "rating": rating,
        })

        products.append({
            "category": category_name,
            "product_name": name[:120],
            "asin": asin,
            "price": price,
            "rating": rating,
            "total_reviews": review_count,
            "estimated_low_star_reviews": estimated_low,
            "opportunity_score": score,
            "product_url": f"https://www.amazon.com/dp/{asin}",
            "review_url_1_3_star": f"https://www.amazon.com/product-reviews/{asin}?filterByStar=critical",
        })

    log.info(f"  Extracted {len(products)} products")
    return products


# ─── MAIN ────────────────────────────────────────────────────────────────────

def main():
    print()
    print("=" * 60)
    print("  ClearLabel Amazon Product Research Scanner")
    print("=" * 60)
    print(f"  Categories to scan: {len(CATEGORIES)}")
    print(f"  Products per category: up to {MAX_PRODUCTS_PER_CATEGORY}")
    print(f"  Delay between requests: {MIN_DELAY}-{MAX_DELAY}s")
    print()

    if not CATEGORIES:
        print("No categories configured.")
        print("Edit the CATEGORIES dict at the top of amazon_scanner.py")
        sys.exit(1)

    all_products = []

    # Scrape Best Sellers pages
    print("Scraping Best Sellers listings...\n")
    for cat_name, cat_url in CATEGORIES.items():
        products = scrape_bestsellers(cat_name, cat_url)
        all_products.extend(products)

    if not all_products:
        print("\nNo products found. Amazon may be blocking requests.")
        print("Try again later, or use the manual method (see README.md).")
        sys.exit(1)

    # Sort by opportunity score
    all_products.sort(key=lambda p: p.get("opportunity_score", 0), reverse=True)

    # Assign final rank
    for i, product in enumerate(all_products):
        product["rank"] = i + 1

    # Write CSV
    output_file = os.path.join(OUTPUT_DIR, f"results_{date.today().isoformat()}.csv")

    fieldnames = [
        "rank", "category", "product_name", "asin", "price",
        "rating", "total_reviews", "estimated_low_star_reviews",
        "opportunity_score", "product_url", "review_url_1_3_star",
        "confusion_notes",
    ]

    with open(output_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        for product in all_products:
            product.setdefault("confusion_notes", "")
            writer.writerow(product)

    # Print summary
    print(f"\n{'='*60}")
    print(f"  DONE!")
    print(f"  Requests made: {request_count}")
    print(f"  Products found: {len(all_products)}")
    print(f"  Results: {output_file}")
    print(f"{'='*60}")

    print(f"\n  TOP 15 CLEARLABEL OPPORTUNITIES:\n")
    print(f"  {'#':<4} {'Score':<8} {'Rating':<7} {'Reviews':<9} {'Est Low':<9} {'Product'}")
    print(f"  {'─'*4} {'─'*8} {'─'*7} {'─'*9} {'─'*9} {'─'*40}")
    for p in all_products[:15]:
        print(
            f"  {p['rank']:<4} {p['opportunity_score']:<8} "
            f"{p['rating']:<7} {p['total_reviews']:<9} "
            f"{p['estimated_low_star_reviews']:<9} "
            f"{p['product_name'][:40]}"
        )

    print(f"\n  NEXT STEPS:")
    print(f"  1. Open {os.path.basename(output_file)} in Google Sheets or Excel")
    print(f"  2. Click the review_url_1_3_star links for the top 15 products")
    print(f"  3. Search reviews (Ctrl+F) for: confusing, setup, manual, support")
    print(f"  4. Add your notes in the 'confusion_notes' column")
    print(f"  5. Best candidates: high reviews + low rating + confusion complaints\n")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Run review_analyzer for a single category by subcategory name."""
import sys
import os
import csv
import logging
from datetime import date

# Reuse all functions from review_analyzer
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from review_analyzer import (
    load_selected_categories, get_top_product, fetch_product_page_data,
    analyze_with_claude, parse_claude_response, SCRIPT_DIR
)
import anthropic
from playwright.sync_api import sync_playwright

logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(message)s", datefmt="%H:%M:%S")
log = logging.getLogger("single")

def main():
    target = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "Air Fryers"

    # Load API key
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        env_file = os.path.join(SCRIPT_DIR, "..", ".env")
        if os.path.exists(env_file):
            with open(env_file) as f:
                for line in f:
                    if line.strip().startswith("ANTHROPIC_API_KEY="):
                        api_key = line.strip().split("=", 1)[1].strip().strip('"')
    if not api_key:
        print("ANTHROPIC_API_KEY not found"); sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)

    # Find the target category
    categories = load_selected_categories()
    cat = None
    for c in categories:
        if c["subcategory"].lower() == target.lower():
            cat = c
            break
    if not cat:
        # Also check unselected categories
        csv_file = os.path.join(SCRIPT_DIR, "category_picks.csv")
        with open(csv_file, "r") as f:
            for row in csv.DictReader(f):
                if row["subcategory"].lower() == target.lower():
                    cat = row
                    break
    if not cat:
        print(f"Category '{target}' not found in category_picks.csv"); sys.exit(1)

    subcategory = cat["subcategory"]
    path = cat["amazon_bestsellers_path"]

    print(f"\n  Analyzing: {subcategory}")
    print(f"  Path: {path}\n")

    # Step 1: Get #1 product
    log.info("Finding #1 Best Seller...")
    name, asin, rating, review_count = get_top_product(path, subcategory)
    if not asin:
        print("  Could not find #1 product. URL may be wrong."); sys.exit(1)
    log.info(f"  #1: {name} ({rating}, {review_count} reviews)")

    # Step 2: Fetch product page
    log.info("Loading product page with Playwright...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page_data = fetch_product_page_data(browser, asin)
        browser.close()

    log.info(f"  Got: {'AI summary' if page_data['customers_say'] else 'no summary'}, {len(page_data['reviews'])} reviews")

    if not page_data["raw_text"]:
        print("  No data extracted from product page."); sys.exit(1)

    # Step 3: Claude analysis
    log.info("Analyzing with Claude...")
    raw = analyze_with_claude(client, name, subcategory, page_data["raw_text"])
    analysis = parse_claude_response(raw)

    # Print results
    print(f"\n{'='*60}")
    print(f"  RESULTS: {subcategory}")
    print(f"{'='*60}")
    print(f"  Product:     {name}")
    print(f"  ASIN:        {asin}")
    print(f"  Rating:      {rating} ({review_count} reviews)")
    print(f"  Stars:       {page_data['star_breakdown']}")
    print(f"  Reviews:     {len(page_data['reviews'])} on page")
    print()
    print(f"  Confusion:   {analysis['confusion_score']}/10")
    print(f"  Setup:       {analysis['setup_difficulty']}/10")
    print(f"  Instructions:{analysis['instruction_quality']}/10")
    print(f"  Elderly/Gift:{analysis['elderly_gift_mentions']}/10")
    print(f"  ClearLabel:  {analysis['clearlabel_fit']}")
    print()
    print(f"  Pain points: {analysis['top_pain_points']}")
    print(f"  Guide topics:{analysis['guide_topics']}")
    print()
    if page_data["customers_say"]:
        print(f"  Amazon AI summary:\n  {page_data['customers_say'][:400]}")
    print(f"\n  Product URL: https://www.amazon.com/dp/{asin}\n")

    # Also print raw Claude response for transparency
    print(f"  --- Raw Claude response ---")
    print(f"  {raw}")
    print()

if __name__ == "__main__":
    main()

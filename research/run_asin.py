#!/usr/bin/env python3
"""Run review_analyzer for specific ASINs directly (bypasses Best Sellers page)."""
import sys
import os
import logging

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from review_analyzer import (
    fetch_product_page_data, analyze_with_claude, parse_claude_response, SCRIPT_DIR
)
import anthropic
from playwright.sync_api import sync_playwright

logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(message)s", datefmt="%H:%M:%S")
log = logging.getLogger("asin")

# Products to analyze
PRODUCTS = [
    {"name": "NuWave Bravo XL Pro Air Fryer Toaster Oven (142 presets, 12 modes)", "asin": "B0CJMV9RZK", "subcategory": "Air Fryers"},
    {"name": "Emeril Lagasse Extra Large French Door Air Fryer Oven (24 functions)", "asin": "B09B7SB46R", "subcategory": "Air Fryers"},
    {"name": "Emeril Lagasse Dual Zone 360 Air Fryer Oven (dual independent zones)", "asin": "B0BZ52FLKC", "subcategory": "Air Fryers"},
]

def main():
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

    print(f"\n{'='*60}")
    print(f"  Air Fryer Deep-Dive Analysis")
    print(f"  {len(PRODUCTS)} products to analyze")
    print(f"{'='*60}\n")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        for i, prod in enumerate(PRODUCTS):
            log.info(f"[{i+1}/{len(PRODUCTS)}] {prod['name'][:60]}")

            # Fetch product page
            log.info("  Loading product page...")
            page_data = fetch_product_page_data(browser, prod["asin"])
            log.info(f"  Got: {'AI summary' if page_data['customers_say'] else 'no summary'}, {len(page_data['reviews'])} reviews")

            if not page_data["raw_text"]:
                print(f"  No data extracted — skipping\n")
                continue

            # Claude analysis
            log.info("  Analyzing with Claude...")
            raw = analyze_with_claude(client, prod["name"], prod["subcategory"], page_data["raw_text"])
            analysis = parse_claude_response(raw)

            print(f"\n  {'─'*56}")
            print(f"  {prod['name']}")
            print(f"  ASIN: {prod['asin']}  |  https://www.amazon.com/dp/{prod['asin']}")
            print(f"  Stars: {page_data['star_breakdown']}")
            print(f"  Reviews on page: {len(page_data['reviews'])}")
            print(f"  {'─'*56}")
            print(f"  Confusion:    {analysis['confusion_score']}/10")
            print(f"  Setup:        {analysis['setup_difficulty']}/10")
            print(f"  Instructions: {analysis['instruction_quality']}/10")
            print(f"  Elderly/Gift: {analysis['elderly_gift_mentions']}/10")
            print(f"  ClearLabel:   {analysis['clearlabel_fit']}")
            print(f"  Pain points:  {analysis['top_pain_points']}")
            print(f"  Guide topics: {analysis['guide_topics']}")
            if page_data["customers_say"]:
                print(f"  Amazon says:  {page_data['customers_say'][:250]}")
            print()

        browser.close()

    print(f"{'='*60}")
    print(f"  Done!")
    print(f"{'='*60}\n")

if __name__ == "__main__":
    main()

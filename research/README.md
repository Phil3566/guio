# ClearLabel Product Research Scanner

Finds popular Amazon products with high user confusion — ideal ClearLabel candidates.

## Quick Start

```bash
cd research
pip install requests beautifulsoup4
python amazon_scanner.py
```

## How It Works

**Phase 1 (automated):** Scrapes Amazon Best Sellers pages for each category. Extracts product name, ASIN, rating, review count, and price.

**Phase 2 (scoring):** Ranks products by opportunity score — a formula combining review volume and rating. Lower rating + more reviews = more confused users = bigger ClearLabel market.

**Phase 3 (your manual check):** The CSV includes clickable links to each product's 1-3 star reviews. Open the top 15 products, search for confusion keywords, and add your notes.

### Opportunity Score

```
score = total_reviews * rating_multiplier
```

| Rating | Multiplier | Meaning |
|--------|-----------|---------|
| 4.5+   | 0.5x      | Well-liked, less opportunity |
| 4.0-4.4 | 1.0x     | Some complaints |
| 3.5-3.9 | 1.5x     | Notable frustration |
| 3.0-3.4 | 2.0x     | High frustration |
| <3.0   | 2.5x      | Very frustrated users |

## Finding Category URLs

1. Go to [amazon.com/bestsellers](https://www.amazon.com/bestsellers)
2. Click into a category (e.g., **Electronics** > **Television & Video**)
3. Copy the URL from your browser
4. Paste it into the `CATEGORIES` dict in `amazon_scanner.py`

### Pre-loaded Categories

| Category | Why |
|----------|-----|
| Microwave Ovens | Proven ClearLabel market (Panasonic + Toshiba done) |
| Printers | WiFi setup confusion, driver issues |
| TVs | Input switching, streaming app setup, remote confusion |
| Routers | App-based setup, security settings |
| Blood Pressure Monitors | Bluetooth pairing, reading interpretation |
| Air Fryers | Preset programs, time/temp for different foods |

## Output

Results are saved to `results_YYYY-MM-DD.csv`:

| Column | What it means |
|--------|---------------|
| rank | Ranked by opportunity score (1 = best) |
| category | Amazon category |
| product_name | Product title |
| asin | Amazon product ID |
| price | Listed price |
| rating | Star rating |
| total_reviews | Total review count |
| estimated_low_star_reviews | Estimated 1-3 star reviews based on rating |
| opportunity_score | Higher = better ClearLabel candidate |
| product_url | Direct Amazon link |
| review_url_1_3_star | Direct link to 1-3 star reviews (open in browser) |
| confusion_notes | Your notes after manually checking reviews |

Open the CSV in **Google Sheets** or **Excel** to sort, filter, and add notes.

## How to Check Reviews (the manual step)

After running the scanner:

1. Open the CSV in Google Sheets
2. Click the `review_url_1_3_star` links for the top 15 products
3. On each review page, search (Ctrl+F / Cmd+F) for:
   - `confusing`, `complicated`, `hard to use`
   - `setup`, `manual`, `instructions`
   - `called support`, `returned`
   - `my mom`, `my dad`, `elderly`, `senior`
4. Type what you find in the `confusion_notes` column
5. Products with the most confusion complaints = your next ClearLabel devices

## Rate Limiting

The script waits 2-4 seconds between requests. A full scan of 6 categories takes about **2 minutes** (one request per category).

## If the Scraper Gets Blocked

Fall back to pure manual research:

1. Open [amazon.com/bestsellers](https://www.amazon.com/bestsellers)
2. Pick a category and open the top 20 products
3. On each product page, click **"See all reviews"**
4. Filter to **1-3 stars** using the star filter
5. Search within reviews for confusion keywords
6. Record your findings in `product_research_template.csv`

## Adding Categories

Edit `amazon_scanner.py` and add entries to the `CATEGORIES` dict:

```python
CATEGORIES = {
    "Microwave Ovens": "https://www.amazon.com/Best-Sellers.../zgbs/kitchen/289935",
    "Your New Category": "https://www.amazon.com/Best-Sellers.../zgbs/...",
}
```

## Spreadsheet Template

`product_research_template.csv` has pre-formatted columns with 5 example rows showing the format and scoring formula. Use it for manual research or to understand the output format.

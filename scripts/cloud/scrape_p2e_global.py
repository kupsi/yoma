"""Scrape the P2E global library:
  1. Parse the landing page HTML for course id + title + category.
  2. Fetch /api/v1/Courses/{id}/Metadata for each (parallel) to get
     description + lesson items + image.
  3. Save the merged catalogue to /tmp/p2e_courses.json.
"""
import re, html, json, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor

LANDING = "/tmp/p2e_global.html"
OUT = "/tmp/p2e_courses.json"
META_URL = "https://global.passport2earning.org/api/v1/Courses/{}/Metadata"
UA = "Mozilla/5.0"


def parse_landing():
    """Walk the HTML linearly so we can track which <h2> category each card
    falls under (the structure is category-section > course-cards-list-container
    > card[id=N])."""
    with open(LANDING, encoding="utf-8") as f:
        page = f.read()

    # Category headings sit between sections.
    headings = list(re.finditer(
        r'<h2[^>]*category-section__heading[^"]*"[^>]*>\s*(.*?)\s*</h2>',
        page, re.S,
    ))
    # Fallback: simpler heading capture.
    if not headings:
        headings = list(re.finditer(r'<h2[^>]*>\s*([A-Z][^<]{2,40})\s*</h2>', page))

    cat_at = [(h.start(), html.unescape(h.group(1)).strip()) for h in headings]

    def category_for(pos):
        cur = "Other"
        for start, name in cat_at:
            if start <= pos:
                cur = name
            else:
                break
        return cur

    rows = []
    # Each course card: data-automation-id="landing-page-course-card" id="88" ...
    # plus the picture container that has alt="<title> Picture Container"
    card_pat = re.compile(
        r'<div class="course-card-container"[^>]*id="(\d+)"[^>]*>'
        r'.*?picture-container"\s+alt="([^"]+)\s+Picture Container"',
        re.S,
    )
    for m in card_pat.finditer(page):
        rows.append({
            "id": int(m.group(1)),
            "title": html.unescape(m.group(2)).strip(),
            "category": category_for(m.start()),
        })
    # dedupe by id, preserving first
    seen = set()
    uniq = []
    for r in rows:
        if r["id"] in seen:
            continue
        seen.add(r["id"])
        uniq.append(r)
    return uniq


def fetch_meta(c):
    req = urllib.request.Request(META_URL.format(c["id"]),
                                 headers={"User-Agent": UA, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            data = json.loads(r.read().decode())
        c["meta"] = {
            "description": (data.get("CourseDescription") or "").strip(),
            "items": data.get("CourseItems") or [],
            "image": data.get("CourseImage") or "",
            "registrationFlow": data.get("CourseRegistrationFlow"),
            "importContentURL": data.get("ImportContentURL") or "",
        }
        # Prefer the API name if present (cleaner than alt-attr text).
        api_name = (data.get("CourseName") or "").strip()
        if api_name:
            c["title"] = api_name
    except urllib.error.HTTPError as e:
        c["meta"] = {"error": f"HTTP {e.code}"}
    except Exception as e:
        c["meta"] = {"error": str(e)}
    return c


def main():
    rows = parse_landing()
    print(f"parsed {len(rows)} cards from landing")
    cats = {}
    for r in rows:
        cats[r["category"]] = cats.get(r["category"], 0) + 1
    for k, v in sorted(cats.items(), key=lambda x: -x[1]):
        print(f"  {v:3d}  {k}")

    print(f"\nfetching metadata for {len(rows)} courses (8 in parallel)...")
    with ThreadPoolExecutor(max_workers=8) as ex:
        rows = list(ex.map(fetch_meta, rows))

    ok = sum(1 for r in rows if "error" not in r["meta"])
    print(f"  metadata ok: {ok}/{len(rows)}")
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(rows, f, indent=2, ensure_ascii=False)
    print(f"\nwrote {OUT}")
    # show a sample
    sample = next((r for r in rows if r["meta"].get("items")), rows[0])
    print("\nsample:")
    print(json.dumps(sample, indent=2, ensure_ascii=False)[:800])


if __name__ == "__main__":
    main()

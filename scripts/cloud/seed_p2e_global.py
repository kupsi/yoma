"""Seed the P2E Yoma instance with all 80 P2E Global Library courses.
Reads /tmp/p2e_courses.json (produced by scrape_p2e_global.py), composes
descriptions from API description + lesson list, maps categories to Yoma's
catalogue, then POSTs each as a Learning opportunity.

Run inside the docker network:
  docker run --rm --network yoma-v3_p2e-net \\
    -v /tmp/seed_p2e_global.py:/s.py:ro \\
    -v /tmp/p2e_courses.json:/courses.json:ro \\
    python:3.12-alpine python3 /s.py
"""
import json, os, re, urllib.request, urllib.error, urllib.parse, datetime

KC = os.environ.get("KC", "http://p2e-keycloak:8092")
API = os.environ.get("API", "http://p2e-api:5000/api/v3")
CATALOGUE = os.environ.get("CATALOGUE", "/courses.json")

T_LEARN = "25f5a835-c3f7-43ca-9840-d372a1d26694"
D_BEG = "e33ae372-c63f-459d-983f-4527355fd0c4"
D_INT = "e84efa58-f0ff-41f4-a2db-12c33f5e306c"
E_ONLINE = "0b2aaf7a-fdcf-4015-9668-d06bdebafa09"
I_HOUR = "82ae49d5-26e0-4b58-be48-a8ecbc3e01bd"

C_AI = "1dc39a5d-e049-4cfe-b708-855fce97b86e"        # AI, Data and Analytics
C_BIZ = "c76786fd-fca9-4633-85b3-11e53486d708"       # Business and Entrepreneurship
C_CAREER = "89f4ab46-0767-494f-a18c-3037f698133a"    # Career and Personal Development
C_TECH = "fa564c1c-591a-4a6d-8294-20165da8866b"      # Technology and Digitization
C_ENV = "d0d322ab-d1d7-44b6-94e8-7b85246aa42e"       # Environment and Climate

# P2E source category → ordered list of Yoma category IDs (first = primary).
CAT_MAP = {
    "Digital Skills":     [C_TECH, C_CAREER],
    "Entrepreneurship":   [C_BIZ, C_CAREER],
    "Financial Literacy": [C_BIZ, C_CAREER],
    "Generative AI":      [C_AI, C_TECH],
    "Green Skills":       [C_ENV, C_CAREER],
    "Job Readiness":      [C_CAREER, C_BIZ],
}

# Lesson-count heuristic for difficulty.
def difficulty_for(lessons):
    return D_INT if len(lessons) >= 8 else D_BEG

# Hour estimate: ~10 minutes per lesson, min 1, capped at 20.
def hours_for(lessons):
    n = len(lessons) or 4
    return max(1, min(20, round(n * 10 / 60)))


CLEAN_PREFIX = re.compile(r"^\s*[\d\-\.a-z]{1,6}[\s\-_\.]+", re.I)
EXTRA_SPACE = re.compile(r"\s+")


def clean_lesson(name):
    """Turn '17-what-is-the-internet' or '22a Search tips' into 'What is the internet'."""
    # Strip a leading numeric token (with optional single letter suffix and
    # optional dot) like '17', '22a', '01.', BEFORE we mangle separators.
    s = re.sub(r"^\s*\d{1,3}[a-z]?\.?\s*[-_\s]?\s*", "", name, count=1, flags=re.I)
    s = s.replace("_", " ").replace("-", " ")
    s = EXTRA_SPACE.sub(" ", s).strip()
    if not s:
        return name
    # Title-case but preserve all-caps words (e.g. "AI", "SWOT")
    parts = []
    for w in s.split():
        if w.isupper():
            parts.append(w)
        else:
            parts.append(w[:1].upper() + w[1:].lower())
    return " ".join(parts)


CATEGORY_INTRO = {
    "Digital Skills":     "A practical digital-skills course on the P2E Global Library —",
    "Entrepreneurship":   "An entrepreneurship course on the P2E Global Library —",
    "Financial Literacy": "A financial-literacy course on the P2E Global Library —",
    "Generative AI":      "A generative-AI course on the P2E Global Library —",
    "Green Skills":       "A green-skills course on the P2E Global Library —",
    "Job Readiness":      "A job-readiness course on the P2E Global Library —",
}


def compose_description(course):
    title = course["title"]
    cat = course["category"]
    meta = course["meta"]
    api_desc = (meta.get("description") or "").strip()
    items = meta.get("items") or []

    lesson_titles = [clean_lesson(i) for i in items if i.strip()]
    # Drop near-duplicates ("How To Use Email" vs "How To Use Email" from
    # different lesson numbers).
    seen = set(); deduped = []
    for lt in lesson_titles:
        k = lt.lower()
        if k in seen: continue
        seen.add(k); deduped.append(lt)
    lesson_titles = deduped

    parts = []
    if api_desc and len(api_desc) > 20:
        # Trust the platform's own copy when they wrote one.
        parts.append(api_desc)
    else:
        intro = CATEGORY_INTRO.get(cat, "A learning course on the P2E Global Library —")
        parts.append(f"{intro} {title}. Self-paced and free for registered learners on passport2earning.org.")

    if lesson_titles:
        sample = ", ".join(lesson_titles[:5])
        if len(lesson_titles) > 5:
            sample += f", and {len(lesson_titles) - 5} more"
        parts.append(f"You'll cover: {sample}.")

    parts.append(
        "Sign in to the P2E Global Library to register and start the course; "
        "your progress + completion stamp the credential onto your Passport."
    )
    return "\n\n".join(parts)


def post_token():
    data = urllib.parse.urlencode({
        "grant_type": "password",
        "client_id": "yoma-web",
        "client_secret": "superSecretYomaWebClientSecret",
        "username": "testorgadminuser@gmail.com",
        "password": "P@ssword12",
        "scope": "openid",
    }).encode()
    req = urllib.request.Request(
        f"{KC}/realms/yoma/protocol/openid-connect/token",
        data=data, method="POST",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())["access_token"]


def get_lookups(token):
    r = lambda p: json.loads(urllib.request.urlopen(urllib.request.Request(
        f"{API}{p}", headers={"Authorization": f"Bearer {token}"}
    )).read().decode())
    langs = r("/lookup/language")
    lang_en = next((l["id"] for l in langs if l["name"] == "English"), None)
    countries = r("/lookup/country")
    ww = next((c["id"] for c in countries if c.get("codeAlpha2") == "WW"), None)
    # search for Yoma org
    body = json.dumps({"valueContains": "Yoma", "pageNumber": 1, "pageSize": 10}).encode()
    req = urllib.request.Request(
        f"{API}/organization/search", data=body, method="POST",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )
    org_data = json.loads(urllib.request.urlopen(req).read().decode())
    org_id = next((o["id"] for o in org_data["items"] if "Yoma" in o["name"]), None)
    return lang_en, ww, org_id


def post_course(token, course, lang_en, country_ww, org_id):
    now = datetime.datetime.now(datetime.timezone.utc)
    start = now.strftime("%Y-%m-%dT%H:%M:%S.000Z")
    end = (now + datetime.timedelta(days=365)).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    cats = CAT_MAP.get(course["category"], [C_CAREER])
    hours = hours_for(course["meta"].get("items") or [])
    diff = difficulty_for(course["meta"].get("items") or [])

    summary = f"{course['title']} — a free course from the P2E Global Library."
    description = compose_description(course)

    instructions = (
        "1. Click the link to open the P2E Global Library.\n"
        f"2. Sign in (or create a free account) and search for '{course['title']}'.\n"
        "3. Register for the course and work through the lessons.\n"
        "4. Complete the course to earn your Passport stamp."
    )

    keywords = [
        course["category"], "P2E", "Passport 2 Earning",
        "Skilling", "Free Course",
    ]

    body = {
        "title": course["title"],
        "summary": summary[:500],
        "description": description,
        "instructions": instructions,
        "typeId": T_LEARN,
        "organizationId": org_id,
        "url": "https://global.passport2earning.org/",
        "verificationEnabled": False,
        "difficultyId": diff,
        "commitmentIntervalId": I_HOUR,
        "commitmentIntervalCount": hours,
        "keywords": keywords,
        "dateStart": start,
        "dateEnd": end,
        "credentialIssuanceEnabled": False,
        "engagementTypeId": E_ONLINE,
        "shareWithPartners": True,
        "hidden": False,
        "categories": cats,
        "countries": [country_ww],
        "languages": [lang_en],
        "postAsActive": True,
    }
    data = json.dumps(body).encode()
    req = urllib.request.Request(
        f"{API}/opportunity", data=data, method="POST",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return True, json.loads(resp.read())["id"]
    except urllib.error.HTTPError as e:
        return False, f"{e.code}: {e.read().decode()[:200]}"


def main():
    with open(CATALOGUE, encoding="utf-8") as f:
        catalogue = json.load(f)
    print(f"Loaded {len(catalogue)} courses from catalogue.")

    print("Fetching token + lookups...")
    token = post_token()
    lang_en, ww, org_id = get_lookups(token)
    print(f"  lang={lang_en}  country_ww={ww}  org={org_id}")

    ok = fail = 0
    for i, c in enumerate(catalogue, 1):
        # refresh token every 50 posts to dodge the 5-min TTL
        if i % 50 == 1 and i > 1:
            token = post_token()
        success, info = post_course(token, c, lang_en, ww, org_id)
        if success:
            ok += 1
        else:
            fail += 1
            print(f"  FAIL  {c['id']}  {c['title']} :: {info}")
        if i % 10 == 0 or i == len(catalogue):
            print(f"  progress {i}/{len(catalogue)}  ok={ok}  fail={fail}")
    print(f"\nDone. created={ok}  failed={fail}")


if __name__ == "__main__":
    main()

"""Soft-delete everything in the P2E Yoma instance except a known good list
(12 placeholder courses + 80 P2E Global Library courses)."""
import json, os, urllib.request, urllib.error, urllib.parse

KC = os.environ.get("KC", "http://p2e-keycloak:8092")
API = os.environ.get("API", "http://p2e-api:5000/api/v3")

_KEEP_ORIG = {
    "Google Digital Garage — Fundamentals of Digital Marketing",
    "freeCodeCamp — Responsive Web Design Certification",
    "CS50: Introduction to Computer Science (Harvard / edX)",
    "Coursera — Machine Learning Specialization (Andrew Ng)",
    "Khan Academy — Intro to JavaScript: Drawing & Animation",
    "Atingi — Digital Skills for the World of Work",
    "Microsoft Learn — Azure Fundamentals (AZ-900)",
    "Duolingo — English for the World of Work",
    "Coursera — Google Project Management Professional Certificate",
    "edX — Introduction to Cloud Computing (IBM)",
    "freeCodeCamp — Data Analysis with Python Certification",
    "Coursera — AI For Everyone (Andrew Ng)",
}
_KEEP_P2E = set()
_p = os.environ.get("CATALOGUE", "/courses.json")
if os.path.exists(_p):
    _KEEP_P2E = {c["title"] for c in json.load(open(_p, encoding="utf-8"))}
KEEP_TITLES = _KEEP_ORIG | _KEEP_P2E
print(f"keep-list size: {len(KEEP_TITLES)} (orig={len(_KEEP_ORIG)} p2e={len(_KEEP_P2E)})")


def get_admin_token():
    data = urllib.parse.urlencode({
        "grant_type": "password",
        "client_id": "yoma-web",
        "client_secret": "superSecretYomaWebClientSecret",
        "username": "testadminuser@gmail.com",
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


def search_page(token, page, status):
    body = json.dumps({
        "valueContains": None, "types": None, "categories": None,
        "languages": None, "organizations": None, "countries": None,
        "engagementTypes": None, "commitmentInterval": None,
        "zltoReward": None, "publishedStates": None, "statuses": [status],
        "mostViewed": None, "mostCompleted": None, "featured": None,
        "pageNumber": page, "pageSize": 200,
    }).encode()
    req = urllib.request.Request(
        f"{API}/opportunity/search/admin", data=body, method="POST",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def delete_one(token, opp_id):
    req = urllib.request.Request(
        f"{API}/opportunity/{opp_id}/Deleted", method="PATCH",
        headers={"Authorization": f"Bearer {token}"},
    )
    try:
        urllib.request.urlopen(req, data=b"")
        return True, None
    except urllib.error.HTTPError as e:
        return False, f"{e.code}: {e.read().decode()[:120]}"


def collect_all(token):
    ids = []
    kept = 0
    for status in ("Active", "Inactive", "Expired"):
        page = 1
        while True:
            data = search_page(token, page, status)
            items = data.get("items", []) or []
            if not items:
                break
            for o in items:
                if o.get("title") in KEEP_TITLES:
                    kept += 1
                    continue
                ids.append((o["id"], o.get("title", "?")[:60], status))
            if page * 200 >= data.get("totalCount", 0):
                break
            page += 1
    return ids, kept


def main():
    print("Fetching admin token...")
    token = get_admin_token()
    print("Collecting opportunities to delete...")
    to_delete, kept = collect_all(token)
    print(f"  to delete: {len(to_delete)}  ·  keeping: {kept}\n")
    if not to_delete:
        print("Nothing to delete. Done."); return
    ok = fail = 0
    REFRESH = 200
    for i, (opp_id, title, status) in enumerate(to_delete, 1):
        if i % REFRESH == 1 and i > 1:
            token = get_admin_token()
        success, err = delete_one(token, opp_id)
        if success:
            ok += 1
        else:
            fail += 1
            if fail <= 5:
                print(f"  FAIL {opp_id}  [{status}]  {title} :: {err}")
        if i % 500 == 0 or i == len(to_delete):
            print(f"  progress {i}/{len(to_delete)}  ok={ok} fail={fail}")
    print(f"\nDone. deleted={ok}  failed={fail}  kept={kept}")


if __name__ == "__main__":
    main()

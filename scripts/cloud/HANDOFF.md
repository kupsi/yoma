# Handoff brief for Claude Code on the cloud server

> You — Claude Code — are running on a fresh Ubuntu cloud server that the
> user spun up to host two demos. This file exists so you don't need to
> re-derive context from scratch. Read it before doing any work; treat the
> dated sections as the most recent state.

---

## What this server is

A 4 GB / 2 vCPU Ubuntu 24.04 box hosting **two parallel Yoma stacks**:

| | Brand | Web | API | Keycloak |
|---|---|---|---|---|
| **Chile Joven** (Spanish, Chile flag colours) | `chile` | `:3000` | `:5000` | `:8091` |
| **Passport 2 Earning** (English, passport navy + foil gold) | `p2e` | `:3100` | `:5100` | `:8092` |

Same source tree, two different builds of the Next.js image (via the
`NEXT_PUBLIC_BRAND` build arg), two completely separate Postgres + Keycloak
instances. The compose project name is `yoma-v3` for both because the root
`.env` pins `COMPOSE_PROJECT_NAME`; functionally they're isolated.

The user is **`linuxuser`** with sudo. The repo lives at `~/yoma` (this
working directory).

## What's been built (high-level, June 2026)

* `THEME_CHILE` and `THEME_P2E` brand variants in
  `src/web/src/styles/{colors,globals}.css` and matching wordmark / footer /
  layout components under `src/web/src/components/{Chile,P2E,Footer,Layout}/`.
* `pages/index.tsx`, `_app.tsx`, `_document.tsx` branch on `BRAND`
  (a compile-time constant read from `process.env.NEXT_PUBLIC_BRAND`).
* `docker-compose.p2e.yml` at repo root is the full parallel stack
  (postgres, valkey, keycloak, api, web + init/health helpers, all
  container names prefixed `p2e-`, ports shifted +100 / +1).
* The P2E instance is seeded with 80 courses scraped from
  passport2earning.org by `scripts/cloud/scrape_p2e_global.py` →
  `scripts/cloud/p2e_courses.json` → `scripts/cloud/seed_p2e_global.py`.
* All post.sql demo content was soft-deleted from P2E by
  `scripts/cloud/cleanup_p2e.py`, leaving only the 80 real courses.

Docs:
* `docs/CHILE_OWNER_GUIDE.md` — owner-facing doc for the Chile aggregator.
* `docs/P2E_AGGREGATOR.md` — same for P2E.
* `scripts/cloud/README.md` — the cloud setup walkthrough.

## How the stacks are run on this server

The wrapper is `scripts/cloud/setup.sh <PUBLIC_IP> [chile|p2e|both]`. It:

1. Adds 4 GB of swap if RAM < 6 GB (this box, yes).
2. Installs Docker if missing.
3. Patches every `localhost` URL in both compose files + appsettings.json
   to the public IP.
4. Adds `KC_HOSTNAME_URL` to both Keycloak services so the issuer claim
   matches what browsers see (otherwise refresh tokens fail).
5. Brings up the requested stack(s). On this 4 GB box, **run one at a time**:
   passing `chile` stops the P2E containers first, and vice versa.
6. Waits for health endpoints.
7. (P2E only) Runs `seed_p2e_global.py` + `cleanup_p2e.py` inside the docker
   network to populate the catalogue and remove demo noise.

Re-running `setup.sh` is idempotent — env patches detect already-patched
files, `docker compose up -d` is a no-op on healthy stacks.

## Common commands

```sh
# bring up one stack
bash scripts/cloud/setup.sh <PUB_IP> chile
bash scripts/cloud/setup.sh <PUB_IP> p2e

# switch stacks (frees RAM)
sudo docker compose stop                                  # stop chile
sudo docker compose -f docker-compose.p2e.yml stop        # stop p2e

# logs
sudo docker compose logs -f yoma-web
sudo docker compose -f docker-compose.p2e.yml logs -f p2e-web

# tear down + drop data
sudo docker compose down -v
sudo docker compose -f docker-compose.p2e.yml down -v
```

## Important quirks

* **Memory is tight.** 4 GB total, so running both stacks together OOMs
  during the Next.js builds. `setup.sh` handles this automatically when you
  pass `chile` or `p2e`. The 4 GB swap file masks intermittent spikes.
* **Keycloak issuer must match the browser-visible URL.** On the cloud
  that's `http://<PUB_IP>:8091` for Chile and `http://<PUB_IP>:8092` for
  P2E. If you change the hostname (e.g. switch to a domain), update
  `KC_HOSTNAME_URL` in both compose files **and** the `KEYCLOAK_ISSUER` env
  in the web service. Or every refresh token will fail with "invalid
  issuer".
* **Demo secrets are checked in.** `superSecretYomaWebClientSecret` etc. in
  `src/keycloak/exports/01-yoma-realm.yaml` are the public ones from the
  upstream didx-xyz/yoma demo. Rotate before sharing the URL publicly.
* **Two compose projects, one Docker label.** Both stacks are tagged with
  `com.docker.compose.project=yoma-v3` because the root `.env` pins
  `COMPOSE_PROJECT_NAME`. Don't run `docker compose down` without `-f`
  pointing to one of the two files — it'll act on whichever happens to be
  active.
* **Test accounts (both stacks):** `testuser@gmail.com`,
  `testorgadminuser@gmail.com`, `testadminuser@gmail.com` — all
  `P@ssword12`.

## Pending / open work

(Update this section as you finish things — leave the history in.)

* TLS not set up — everything's plain HTTP on the public IP. Caddy with
  Let's Encrypt is the recommended next step if the URL becomes shareable.
* The seed scripts run as the demo `testorgadminuser` / `testadminuser`
  and use the demo Keycloak passwords. Rotating those will break the
  scripts; update them in lockstep.
* No backup of either Postgres yet. `pg_dump` on a cron + ship to S3 / GCS
  is the obvious next step if the demo accumulates real content.
* The 12 "placeholder" courses from the local instance (Coursera, edX,
  freeCodeCamp etc.) are NOT on the cloud — only the 80 P2E Global ones
  are. If they're wanted, the seed script for them was lost; reconstruct
  from the title list in `scripts/cloud/cleanup_p2e.py` (`_KEEP_ORIG`).

## Useful commands for orienting yourself

```sh
# what's running
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# what's in either DB (no SQL needed — use the search API)
TOKEN=$(curl -s -X POST "http://<PUB_IP>:8092/realms/yoma/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=yoma-web&client_secret=superSecretYomaWebClientSecret&username=testorgadminuser@gmail.com&password=P@ssword12&scope=openid" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
curl -s -X POST "http://<PUB_IP>:5100/api/v3/opportunity/search" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"pageNumber":1,"pageSize":5,"publishedStates":["Active"]}' | python3 -m json.tool

# recent git activity on this branch
git log --oneline -20
```

## Style guidance from the user (carried over from the local instance)

* Spanish for any Chile-facing copy. English for P2E.
* Keep test passwords as `P@ssword12` in dev/demo contexts.
* Don't ask before iterating on aggregator branding (theme tweaks, copy,
  layout). Ask before destructive ops on the DB or any cross-stack change.
* The Keycloak issuer / hostname problem has bitten us multiple times; if
  you're touching Keycloak config, double-check the issuer matches both
  what the API expects (`Keycloak__AuthServerUrl` env) and what the browser
  hits.

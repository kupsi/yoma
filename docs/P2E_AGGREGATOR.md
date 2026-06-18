# Passport 2 Earning (P2E) — Aggregator Prototype

A separate, parallel Yoma instance branded as **Passport 2 Earning** — a
skilling-only aggregator. Same codebase as the main `yoma-v3` stack (Chile
Joven demo), running side-by-side with no port or container conflicts.

The P2E narrative: **collect verified skilling stamps from global partners,
carried in your YoID passport.**

---

## What you get

| | Chile Joven (current default) | **P2E (this doc)** |
|---|---|---|
| Web | `http://localhost:3000` | `http://localhost:3100` |
| API | `http://localhost:5000/swagger` | `http://localhost:5100/swagger` |
| Keycloak | `http://keycloak:8091` | `http://p2e-keycloak:8092` |
| Brand | Chile flag (blue / red, ES) | Passport navy + foil gold (EN) |
| Content | Mixed (Learning + Job + Other) | **Learning only** |
| Database | `yoma-postgres` (volume `postgres`) | `p2e-postgres` (volume `p2e-postgres`) |
| Compose project | `yoma-v3` | `p2e-aggregator` |
| Compose file | `docker-compose.yml` | `docker-compose.p2e.yml` |

Both stacks are fully isolated: separate Postgres, separate Keycloak realm
DB, separate Valkey, separate Docker network. The only thing they share is
the code on disk (same source tree, different env vars at build/run time).

---

## One-time setup

Add a hosts entry so the browser can reach Keycloak on the same hostname the
container uses to issue tokens:

**Linux / WSL:**
```sh
echo "127.0.0.1 p2e-keycloak" | sudo tee -a /etc/hosts
```

**Windows** (admin PowerShell, only needed for Windows-side browsers):
```powershell
Add-Content -Path "C:\Windows\System32\drivers\etc\hosts" -Value "`n127.0.0.1 p2e-keycloak"
```

Without this, signing in works once, then refresh tokens fail with "Session
expired" — Keycloak stamps tokens with the `p2e-keycloak:8092` issuer, the
browser must reach it under the same hostname for the issuer to validate.

---

## Bring it up

```sh
# from project root
sudo docker compose -f docker-compose.p2e.yml up -d
```

First run takes ~10 min because it builds the `local/p2e-web` image with
`NEXT_PUBLIC_BRAND=p2e`. The `local/yoma-api` image is shared with the Chile
stack — no rebuild needed if it already exists.

To force a fresh web build (e.g. after editing branding code):
```sh
sudo docker compose -f docker-compose.p2e.yml build p2e-web
sudo docker compose -f docker-compose.p2e.yml up -d
```

Watch logs:
```sh
sudo docker compose -f docker-compose.p2e.yml logs -f p2e-web
sudo docker compose -f docker-compose.p2e.yml logs -f p2e-api
```

Bring it down (without touching Chile):
```sh
sudo docker compose -f docker-compose.p2e.yml down
```

Wipe data (drops both Postgres volumes):
```sh
sudo docker compose -f docker-compose.p2e.yml down -v
```

---

## Test accounts (same as Chile, seeded into the new realm)

| Email | Password | Role |
|---|---|---|
| `testuser@gmail.com` | `P@ssword12` | Regular user |
| `testorgadminuser@gmail.com` | `P@ssword12` | Organisation admin |
| `testadminuser@gmail.com` | `P@ssword12` | Platform admin |

Keycloak admin console:
- URL: `http://p2e-keycloak:8092` (or `http://localhost:8092` from the host machine)
- User: `admin` / Password: `password`

---

## Seeding skilling content

A Python seed script creates 12 Learning opportunities from global skilling
partners (Coursera, freeCodeCamp, Khan Academy, edX, Microsoft Learn,
Duolingo, Google, Atingi, etc.).

After the stack is healthy:
```sh
python3 /tmp/create_p2e_seed.py
```

Each opportunity:
- `typeId` = **Learning** (no Job / Event / Micro-task content on this instance)
- Country = **Worldwide**, Language = **English**
- Posted as `Active`, so it shows on the landing carousel immediately

The script authenticates against `p2e-keycloak:8092` and POSTs to
`localhost:5100/api/v3/opportunity` as `testorgadminuser@gmail.com`. Token
fetching uses the container hostname so the issuer matches — same pattern
as the Chile seed scripts.

To add more opportunities, copy an entry in `OPPS = [...]` and re-run.

---

## What was customised (vs. base Yoma)

### Brand selector (build-time)
- `src/web/src/lib/constants.ts` — new `BRAND` constant reads
  `process.env.NEXT_PUBLIC_BRAND` (defaults to `chile`).
- `src/web/Dockerfile` — added `ARG NEXT_PUBLIC_BRAND=chile` build arg.
- `src/web/src/pages/_app.tsx` — forces theme = BRAND site-wide.
- `src/web/src/pages/_document.tsx` — sets `<html lang>` and `data-theme`
  from BRAND.
- `src/web/src/components/NavBar/Navbar.tsx` — renders `P2EWordmark` when
  BRAND = p2e.
- `src/web/src/pages/index.tsx` — branches on BRAND in `getStaticProps`
  (Learning filter vs. country filter) and in the render (returns
  `<P2EHome>` early when p2e).

### P2E branding
- `src/web/src/styles/colors.css` — `--color-p2e-navy`, `--color-p2e-gold`,
  `--color-p2e-cream`.
- `src/web/src/styles/globals.css` — `[data-theme="p2e"]` block (navbar
  background, drawer sidebar, main background, nprogress accent).
- `src/web/src/components/P2E/P2EWordmark.tsx` — passport-stamp wordmark.
- `src/web/src/components/P2E/P2EHome.tsx` — landing page (hero, pillars,
  category chips, featured carousel, partners, CTA).
- `src/web/src/components/Footer/P2EFooter.tsx` — branded footer.
- `src/web/src/components/Layout/P2ELayout.tsx` — landing-page layout
  wrapper.

### Parallel stack
- `docker-compose.p2e.yml` — self-contained second stack: postgres, valkey,
  keycloak, keycloak-pg, keycloak-config, keycloak-users, postgres-init,
  api, web, plus init/health helpers. All container names prefixed `p2e-`,
  isolated network `p2e-net`, all ports shifted to avoid the Chile stack.

### Reused unchanged
- The Yoma .NET API image (same Docker image; brand isn't read on the
  server). Behaviour differs only via env vars.
- The Keycloak realm YAML (`src/keycloak/exports/01-yoma-realm.yaml`). Both
  stacks substitute their own client URLs through `keycloak-config-cli`.

---

## How the brand is decided

The brand is **baked into the web image at build time** via the
`NEXT_PUBLIC_BRAND` build arg. This is intentional — the brand controls:

- Theme (`data-theme`) — set in `_document.tsx`
- Landing page layout — chosen in `pages/index.tsx`
- Footer + layout — chosen in `getLayout`
- Navbar wordmark — chosen in `Navbar.tsx`

All of these need to be consistent across SSR and client hydration, so a
build-time const (`BRAND`) is simpler and faster than runtime detection.
The trade-off: switching brand requires a `docker compose build` of the web
service. The API image is brand-independent and is reused between stacks.

---

## Known quirks

- **First-run timing**: the `p2e-postgres-init` and `p2e-keycloak-users`
  jobs both wait on `p2e-api-health`, which itself waits for the API to
  finish migrations + lookup-data seed. First boot takes 2-3 min before
  test users exist.
- **Seed script must reach `p2e-keycloak`**: if you forget the hosts file
  entry, the seed script will fail with `Name or service not known` when
  fetching the token. Add the hosts entry and re-run.
- **One web image per brand**: `local/yoma-web:latest` (Chile) and
  `local/p2e-web:latest` are different images. Don't `--build` from a
  compose file that doesn't set the correct `NEXT_PUBLIC_BRAND` arg.

---

## Extending the prototype

Common next steps:

| Goal | Where to change |
|---|---|
| Add more skilling opportunities | Edit `OPPS` in `/tmp/create_p2e_seed.py`, rerun |
| Add a new skilling partner SSO | Add a new client to `src/keycloak/exports/01-yoma-realm.yaml` + env vars in `docker-compose.p2e.yml` under `p2e-keycloak-config` |
| Change brand colors | Edit `--color-p2e-*` in `src/web/src/styles/colors.css` |
| Adjust the landing copy | Edit `src/web/src/components/P2E/P2EHome.tsx` (then rebuild p2e-web) |
| Run side-by-side with Chile | They already do — both compose files coexist |
| Deploy P2E remotely | Add a CI/CD pipeline that builds `local/p2e-web` with `NEXT_PUBLIC_BRAND=p2e`, pushes to a registry, and a Helm release or compose-on-VM that mirrors `docker-compose.p2e.yml` |

---

## Quick reference

| Action | Command |
|---|---|
| Bring up P2E | `sudo docker compose -f docker-compose.p2e.yml up -d` |
| Rebuild web | `sudo docker compose -f docker-compose.p2e.yml build p2e-web && sudo docker compose -f docker-compose.p2e.yml up -d` |
| Bring down | `sudo docker compose -f docker-compose.p2e.yml down` |
| Wipe DBs | `sudo docker compose -f docker-compose.p2e.yml down -v` |
| Logs | `sudo docker compose -f docker-compose.p2e.yml logs -f <service>` |
| Seed content | `python3 /tmp/create_p2e_seed.py` |
| Landing | http://localhost:3100 |
| API | http://localhost:5100/swagger |
| Keycloak admin | http://p2e-keycloak:8092 (admin / password) |

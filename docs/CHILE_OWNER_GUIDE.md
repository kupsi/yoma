# Chile Joven — Owner & Maintenance Guide

*Prepared for the Chile UNICEF Country Office.*

This guide describes the **Chile Joven** demo instance: a country-branded
aggregator of youth opportunities, built on top of the open-source
[Yoma](https://github.com/didx-xyz/yoma) platform. It explains what was
deployed, how it was customized, how to keep adding content, and how to
collaborate with an AI engineering agent (Claude Code) on future changes.

---

## 1. What this instance is

Chile Joven is a **demonstration aggregator** — a country instance of Yoma,
re-themed and re-populated for Chilean youth. It currently runs **locally**
on a single developer laptop (Docker Compose) and is not yet a
production deployment. The same codebase and configuration can be promoted
to a hosted environment (Kubernetes, a managed VM, or any container
orchestrator) when the country office decides to publish it.

Headline characteristics of the current build:

- **Branding:** Chile flag colours (deep blue `#0033a0`, red `#da291c`,
  white). Custom wordmark "**Chile Joven**" with an inline SVG flag,
  Open Sans typography, consistent across the navbar, sidebar, hero,
  footer.
- **Language:** Spanish content throughout the landing page and an
  initial catalogue of opportunities tagged `country=Chile`,
  `language=Spanish`.
- **Initial content:** 10 real-world Chilean youth-skilling
  opportunities (SENCE, Talento Digital, Sercotec, Laboratoria,
  Google Actívate, etc.) — see §5 for the full list.
- **All other Yoma features still work:** user accounts, organisations,
  marketplace, rewards (Zlto tokens), YoID identity, news feed, etc.

---

## 2. Local deployment recap

The whole stack runs via Docker Compose from the repository root:

```sh
git clone https://github.com/kupsi/yoma
cd yoma
docker compose up -d
```

Services and host ports:

| Service        | URL                                  | Notes                       |
|----------------|--------------------------------------|-----------------------------|
| Web (Next.js)  | <http://localhost:3000>              | Public-facing site          |
| API (.NET)     | <http://localhost:5000>              | Swagger at `/swagger`       |
| Keycloak       | <http://keycloak:8091>               | IdP (admin/password)        |
| Postgres (API) | `localhost:5432`                     | Yoma DB                     |
| Postgres (KC)  | `localhost:5433`                     | Keycloak DB                 |
| Valkey (cache) | internal only                        |                             |

**Hosts entry required (one-time setup on every machine that views the site):**

```
127.0.0.1 keycloak
```

— added on Linux to `/etc/hosts`, on Windows to
`C:\Windows\System32\drivers\etc\hosts`. This is what lets the browser
reach Keycloak using the same hostname the back-end uses internally
(`keycloak:8091`). Without it, login redirects fail with "Server not found".

**Seeded test accounts** (password for all: `P@ssword12`):

| Email                          | Role               | Use for                              |
|--------------------------------|--------------------|--------------------------------------|
| `testadminuser@gmail.com`      | Admin              | Full platform access                 |
| `testorgadminuser@gmail.com`   | Organisation Admin | Adding opportunities to "Yoma" org   |
| `testuser@gmail.com`           | Regular user       | Completing opportunities, marketplace|

---

## 3. What was customized

All Chile-specific changes are contained to a small number of files. This
makes it easy to track changes via `git diff master`.

### 3.1 Branding & colours

`src/web/src/styles/colors.css` — added Chile brand palette:

```css
--color-chile-blue: #0033a0;
--color-chile-blue-dark: #002577;
--color-chile-blue-light: #e7edf8;
--color-chile-red: #da291c;
--color-chile-red-dark: #b21f15;
```

`src/web/src/styles/globals.css` — added `[data-theme="chile"]` rules
binding the brand colours to:

- The top navbar (`.bg-theme` → Chile blue with white text/links)
- The left drawer sidebar (Chile red with white text)
- The progress bar (Chile red)
- The font family (Open Sans)
- The opportunities page background (a deeper slate-blue so cards stand out)

### 3.2 Theme wiring

- `src/web/src/lib/constants.ts` — exports `THEME_CHILE = "chile"`.
- `src/web/src/pages/_app.tsx` — forces `THEME_CHILE` site-wide so every
  page (including admin pages) carries Chile branding.
- `src/web/src/pages/_document.tsx` — sets `<html lang="es" data-theme="chile">`
  so server-rendered HTML is already Chile-branded before JavaScript hydrates.

### 3.3 Custom components

- `src/web/src/components/Chile/ChileWordmark.tsx` — the
  "Chile Joven" logo (inline SVG flag + wordmark).
- `src/web/src/components/Layout/ChileLayout.tsx` — landing-page layout.
- `src/web/src/components/Footer/ChileFooter.tsx` — Spanish footer with
  the navy/red/white accent bar.
- `src/web/src/components/NavBar/Navbar.tsx` — gained a Chile branch
  that renders the wordmark in a white pill at the top-left.

### 3.4 Landing page

`src/web/src/pages/index.tsx` was rewritten in Spanish with the following
sections, in order:

1. Demo banner ("Este es un agregador de demostración…")
2. Hero: Chile Joven logo, search, CTAs
3. Flag-colour accent stripe
4. About Chile Joven
5. Three pillars (Aprende / Capacítate / Crece)
6. Categories chip cloud (pre-filtered to Chile)
7. Stats strip
8. How it works (3 steps)
9. Rewards (Zlto)
10. **Spanish opportunities carousel** — pulls live from the API
    filtered by `country=Chile`
11. Partners (SENCE, Talento Digital, Kodea, Laboratoria, …)
12. Latest stories (from the Yoma news feed)
13. Closing badge

All "Comienza gratis" / "Ver oportunidades" / search-bar / category CTAs
are pre-filtered to Chile so users land on country-specific results.

### 3.5 Network changes

- Keycloak moved off port `8080` to `8091` (avoiding a clash with another
  local project). Updated everywhere: `src/api/docker-compose.yml`,
  `src/web/docker-compose.yml`, `src/api/src/application/Yoma.Core.Api/appsettings.json`.
- `KC_HOSTNAME_URL` / `KC_HOSTNAME_ADMIN_URL` env vars commented out
  (they were left over from ngrok testing and caused issuer-mismatch
  errors on local login).

---

## 4. Adding opportunities (two methods)

There are **two ways** to add an opportunity. Both end up in the same
database and both appear on the landing-page carousel and `/opportunities`
search.

### 4.1 Manually via the admin UI

For occasional / individual additions by a partner or country-office
content manager.

1. Sign in at <http://localhost:3000> as an Admin or Organisation Admin.
2. **Top nav → Organisations** → pick the organisation that owns the
   opportunity (e.g. *Yoma (Youth Agency Marketplace)*).
3. Inside the organisation, click the **Opportunities** tab.
4. Click **Create Opportunity** (top-right).
5. Fill the multi-step form:

   | Step                | What to enter                                                      |
   |---------------------|--------------------------------------------------------------------|
   | General             | Title, summary, description, instructions, type, engagement, URL   |
   | Details             | Categories, difficulty, commitment (e.g. 10 hours), languages, **countries = Chile**, keywords |
   | Rewards (optional)  | Zlto reward amount + pool                                          |
   | Verification        | **Leave OFF on this local instance** (see §7 limitations)          |
   | Credential issuance | **Leave OFF on this local instance**                               |
   | Preview & Publish   | Review, then **Publish** to make it Active immediately             |

6. New opportunities show up immediately under `/opportunities` and
   within 5 minutes on the landing carousel (the home page is
   incrementally re-generated with a 5-minute revalidation window).

**Shortcut URL:** `http://localhost:3000/organisations/<orgId>/opportunities/create`

### 4.2 In bulk via the REST API

For larger one-off imports, automated syncs from partner catalogues, or
scripted seeding (this is how the 10 Chilean opportunities were added).

**Step A — get an admin access token from Keycloak:**

```sh
curl -X POST "http://keycloak:8091/realms/yoma/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=yoma-web" \
  -d "client_secret=superSecretYomaWebClientSecret" \
  -d "grant_type=password" \
  -d "username=testadminuser@gmail.com" \
  -d "password=P@ssword12" \
  -d "scope=openid yoma-api"
```

(Real client secret, real password — change both for any non-demo deployment.)

**Step B — discover the lookup IDs you'll need:**

These return GUIDs the create endpoint expects.

| Lookup            | Endpoint                                                          | Auth required |
|-------------------|-------------------------------------------------------------------|---------------|
| Countries         | `GET /api/v3/lookup/country`                                      | No            |
| Languages         | `GET /api/v3/lookup/language`                                     | No            |
| Engagement types  | `GET /api/v3/lookup/engagement`                                   | No            |
| Opportunity types | `GET /api/v3/opportunity/type`                                    | Yes           |
| Categories        | `GET /api/v3/opportunity/category`                                | Yes           |
| Difficulties      | `GET /api/v3/opportunity/difficulty`                              | Yes           |
| Commitment ranges | `GET /api/v3/opportunity/search/filter/commitmentInterval`        | No            |
| Verification types| `GET /api/v3/opportunity/verificationType`                        | Yes           |
| Organisations     | `POST /api/v3/organization/search` body `{"valueContains":"..."}` | Yes           |

For Chile content, the most-used IDs are:

```
Chile country:                   a3fdbeb2-4d00-4536-aab1-352848d24637
Spanish (Castilian) language:    4a45c012-c7bb-46c1-b1bd-bbac02c00d05
Online engagement:               0b2aaf7a-fdcf-4015-9668-d06bdebafa09
Type "Learning":                 25f5a835-c3f7-43ca-9840-d372a1d26694
Difficulty "Beginner":           e33ae372-c63f-459d-983f-4527355fd0c4
Yoma (Youth Agency Marketplace): f89b3bd7-8b17-42f3-8a8f-5485ae242b9f
```

These IDs are stable for the seeded instance. After a Keycloak/DB rebuild
they may regenerate — always re-fetch from the lookup endpoints first.

**Step C — POST a new opportunity:**

```sh
curl -X POST "http://localhost:5000/api/v3/opportunity" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Curso de ejemplo",
    "description": "Descripción del curso...",
    "summary": "Resumen corto.",
    "instructions": "Pasos para completar...",
    "typeId":          "25f5a835-c3f7-43ca-9840-d372a1d26694",
    "organizationId":  "f89b3bd7-8b17-42f3-8a8f-5485ae242b9f",
    "url":             "https://example.cl/curso",
    "verificationEnabled":        false,
    "difficultyId":    "e33ae372-c63f-459d-983f-4527355fd0c4",
    "commitmentIntervalId":       "82ae49d5-26e0-4b58-be48-a8ecbc3e01bd",
    "commitmentIntervalCount":    10,
    "keywords":        ["Habilidades Digitales", "Chile"],
    "dateStart":       "2026-06-02T00:00:00.000Z",
    "credentialIssuanceEnabled":  false,
    "engagementTypeId": "0b2aaf7a-fdcf-4015-9668-d06bdebafa09",
    "shareWithPartners": true,
    "hidden":          false,
    "categories":      ["fa564c1c-591a-4a6d-8294-20165da8866b"],
    "countries":       ["a3fdbeb2-4d00-4536-aab1-352848d24637"],
    "languages":       ["4a45c012-c7bb-46c1-b1bd-bbac02c00d05"],
    "postAsActive":    true
  }'
```

A successful response returns the created opportunity with `status: Active`
and `published: true`. The fastest way to script a batch is to put the
common fields in a small Python or Node script and loop over your input list
(see `/tmp/create_chile.py` from the original seeding session for a working
example — also reproduced inline in this guide's appendix on request).

### 4.3 Bulk CSV import (also UI)

Inside an organisation's **Opportunities** tab there is also a **CSV
Import** option. This is the most ergonomic path if a partner can produce
a spreadsheet of programs.

---

## 5. Initial Spanish content currently published

| # | Title                                                            | Source                   | Category                                       |
|---|------------------------------------------------------------------|--------------------------|------------------------------------------------|
| 1 | Google Actívate: Fundamentos del Marketing Digital               | Google Actívate          | Business, Career & Personal Development        |
| 2 | Capacítate para el Empleo: Atención y Servicio al Cliente        | Fundación Carlos Slim    | Career & Personal Development                  |
| 3 | SENCE: Excel para el Trabajo                                     | SENCE                    | Tech & Digitization, Career                    |
| 4 | Inglés para el Trabajo (nivel inicial)                           | British Council Chile    | Career & Personal Development                  |
| 5 | Talento Digital para Chile: Bootcamp Full Stack                  | Kodea / SENCE / BID      | Tech & Digitization, Career                    |
| 6 | Desafío Latam: Introducción a la Programación con JavaScript     | Desafío Latam            | Tech & Digitization                            |
| 7 | Laboratoria: Bootcamp para Mujeres en Tecnología                 | Laboratoria              | Tech & Digitization, Career                    |
| 8 | Emprendimiento Joven: Crea tu Plan de Negocios                   | Sercotec / Corfo         | Business & Entrepreneurship                    |
| 9 | Empleos Verdes: Introducción a las Energías Renovables           | Ministerio de Energía    | Environment & Climate, Tech                    |
| 10| Fundamentos de Datos e Inteligencia Artificial                   | Coursera (ES)            | AI, Data and Analytics, Tech                   |

These were inserted via the REST API. They link to each institution's
real public page but the titles, descriptions, durations and instructions
are stylised summaries written for the demo. **Before going public, the
country office should agree with each institution about phrasing, URLs,
and whether to surface specific cohorts vs. their general program page.**

---

## 6. Ongoing maintenance — who does what

### 6.1 Content (frequent, low-technical)

| Task                                    | Who              | How                              |
|-----------------------------------------|------------------|----------------------------------|
| Add / update individual opportunities   | Content manager  | Admin UI (§4.1) or CSV import    |
| Onboard a new partner organisation      | Admin            | Admin UI → Organisations → Create|
| Translate landing copy                  | Translator       | Edit `src/web/src/pages/index.tsx` (or ask Claude Code) |
| Update partner logos in the footer      | Content manager  | Edit `ChileFooter.tsx`           |

### 6.2 Infrastructure (occasional, technical)

| Task                                    | Who              | How                              |
|-----------------------------------------|------------------|----------------------------------|
| Upgrade Yoma core to a new upstream tag | Engineer         | `git pull upstream master` + rebuild |
| Move from local Docker to hosted        | Engineer         | Deploy via Helm chart (see upstream `helm/`) |
| Configure real S3 for image uploads     | Engineer         | Fill `AWSS3` block in `appsettings.Local.json` |
| Enable SSI / verifiable credentials     | Engineer         | Stand up an Aries cloud agent and point the API at it |
| Connect Single Sign-On (e.g. ClaveÚnica)| Engineer         | Add a Keycloak OIDC provider in `01-yoma-realm.yaml` |

### 6.3 Using Claude Code as an ongoing agent

The Yoma repo includes a `CLAUDE.md` file at the project root that gives
Claude Code (Anthropic's CLI coding agent) the architectural context it
needs to be productive in this codebase. To use it:

1. Install Claude Code on the maintainer's laptop (Mac/Windows/Linux —
   `npm install -g @anthropic-ai/claude-code` or via the installer).
2. From the repo root, run `claude` and ask it for what you need.

Concrete examples the agent can handle directly:

- *"Change the Chile Joven landing tagline from 'Tu futuro comienza hoy'
  to 'Construye tu camino' and rebuild the web container."*
- *"Add three new opportunities to the carousel: …, …, …. Use the SENCE
  org. Languages: Spanish. Countries: Chile."*
- *"Replace the partner list in the footer with these 12 names."*
- *"Add a new ClaveÚnica SSO provider to Keycloak, with redirect URL X."*
- *"The footer phone number should change to …"*
- *"Spin up an opportunity-import script that pulls from partner X's
  RSS feed and posts to the Yoma API on a cron."*
- *"Audit the codebase for hard-coded English strings on user-facing
  pages and report them so I can translate them."*

The agent can read source files, run shell commands (rebuilds, API
queries, log inspection), and apply diffs. The country office can keep
its engineering footprint minimal by routing most modifications through
Claude Code rather than doing them manually.

For governance, keep a maintainer to review and `git commit` every
change before pushing. Treat Claude Code as a fast junior engineer:
trust but verify.

---

## 7. Known limitations of the local demo

These are not bugs of Yoma; they are things that are not configured on
this laptop and would be set up for any real deployment.

| Limitation                                           | Why                                       | Fix when going live                |
|------------------------------------------------------|-------------------------------------------|------------------------------------|
| Image uploads fail ("The specified bucket is not valid") | `AWSS3` credentials are placeholders      | Provide real S3 (or MinIO) creds   |
| Verifiable credentials cannot be issued              | No Aries Cloud Agent running              | Stand up Aries + Trust Registry    |
| SSO partners (ClaveÚnica, etc.) cannot reach Keycloak| Keycloak only listens on the local laptop | Deploy Keycloak with a public DNS  |
| Public sign-up doesn't send confirmation emails      | SendGrid API key not configured           | Add SendGrid creds                 |
| Phone-OTP login uses a dummy provider                | Twilio not configured                     | Add Twilio creds                   |
| Landing-page revalidation is 5 min                   | Next.js ISR cache window                  | Tune `revalidate` in `index.tsx`   |

All of these are config changes, not code changes.

---

## 8. Quick reference

### Important URLs

| Page                              | URL                                                       |
|-----------------------------------|-----------------------------------------------------------|
| Landing                           | <http://localhost:3000>                                   |
| Opportunities (filtered to Chile) | `/opportunities?countries=a3fdbeb2-4d00-4536-aab1-352848d24637` |
| Admin: opportunities list         | `/admin/opportunities`                                    |
| Org admin: create opportunity     | `/organisations/<orgId>/opportunities/create`             |
| API Swagger                       | <http://localhost:5000/swagger>                           |
| Keycloak admin console            | <http://keycloak:8091/admin/master/console>               |

### Important files

| What                  | File                                                  |
|-----------------------|-------------------------------------------------------|
| Brand colours         | `src/web/src/styles/colors.css`                       |
| Theme CSS rules       | `src/web/src/styles/globals.css`                      |
| Landing page          | `src/web/src/pages/index.tsx`                         |
| Logo wordmark         | `src/web/src/components/Chile/ChileWordmark.tsx`      |
| Footer                | `src/web/src/components/Footer/ChileFooter.tsx`       |
| Navbar                | `src/web/src/components/NavBar/Navbar.tsx`            |
| API config            | `src/api/src/application/Yoma.Core.Api/appsettings.json`|
| Realm definition (KC) | `src/keycloak/exports/01-yoma-realm.yaml`             |
| Docker stack (API)    | `src/api/docker-compose.yml`                          |
| Docker stack (Web)    | `src/web/docker-compose.yml`                          |
| Architectural overview| `CLAUDE.md` (project root)                            |

### Rebuilding after a change

```sh
# After editing web files
docker compose up --build -d yoma-web

# After editing API config
docker compose up --build -d yoma-api

# After editing Keycloak realm
docker compose up -d --force-recreate keycloak keycloak-config
```

---

## 9. Suggested next steps for the country office

1. **Decide ownership.** Who is the technical owner (engineer) and who
   is the content owner (programs / partnerships)?
2. **Walk each priority partner** (SENCE, Talento Digital, Sercotec,
   Laboratoria, etc.) through the platform — get their consent on titles
   and direct URLs, and ideally have each become an Organisation in
   Yoma so they self-manage their own opportunities.
3. **Pick a hosting target.** UNICEF Azure, AWS, GCP, or a local Chilean
   cloud — the same Docker Compose stack lifts to any of them.
4. **Decide on identity strategy.** Email/phone signup only, or
   federate with **ClaveÚnica** for a national-ID-backed login?
5. **Decide on rewards strategy.** Keep the Zlto tokens for symbolic
   gamification, or partner with a Chilean rewards / voucher provider?
6. **Establish a content cadence.** Weekly partner sync? Monthly
   review? Use the admin UI's *Featured* flag to spotlight time-sensitive
   programs.
7. **Set up Claude Code** for the technical owner so most copy /
   colour / partner-list changes can be done in conversation rather
   than scheduled engineering work.

---

*Document prepared: June 2026. Built on Yoma platform
(<https://github.com/didx-xyz/yoma>).*

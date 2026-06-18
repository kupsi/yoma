# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Local Development

The entire stack runs via Docker Compose from the project root:

```sh
sudo docker compose up -d           # start all services
sudo docker compose up --build -d   # rebuild images and start
sudo docker compose down            # stop all services
sudo docker logs <container> -f     # tail logs for a service
```

Port mappings (local):
- Web UI: http://localhost:3000
- API: http://localhost:5000 (Swagger at /swagger)
- Keycloak: http://localhost:8081 (admin / password)
- Keycloak DB: localhost:5433

Test users seeded automatically: `testuser@gmail.com`, `testorgadminuser@gmail.com`, `testadminuser@gmail.com` — all use password `P@ssword12`.

Tooling is managed via `mise`. Run `mise install` then `mise trust` to set up Node 20, .NET 10, Java 17 (Keycloak plugin builds), and Tilt.

### Web (Next.js 15, `src/web/`)

```sh
cd src/web
yarn install --frozen-lockfile
yarn dev          # dev server on :3000
yarn lint         # ESLint + Prettier check
yarn format       # Prettier auto-fix
yarn build        # production build
```

### API (.NET 10, `src/api/`)

```sh
cd src/api
dotnet restore
dotnet build
dotnet run --project src/application/Yoma.Core.Api
dotnet test                                           # all tests
dotnet test --filter "FullyQualifiedName~SomeTest"   # single test
```

`appsettings.Local.json` is gitignored but required — the Docker volume mount expects it at `src/api/src/application/Yoma.Core.Api/appsettings.Local.json`. A minimal version with placeholder values is sufficient for local dev.

### E2E Tests

```sh
yarn test:cypress   # opens Cypress UI
```

## Architecture

The repo contains three independently deployable components wired together via Docker Compose:

**`src/api/`** — .NET 10 clean-architecture API  
Layers: `application` (API host, controllers) → `domain` (business logic, interfaces) → `infrastructure` (implementations).  
Infrastructure packages are per-integration: `Database` (EF Core + PostgreSQL), `Keycloak` (admin client), `AmazonS3`, `SendGrid`, `Zlto`, `Chimoney`, `AriesCloud`, `Emsi`, `Bitly`, `SAYouth`, `Substack`, `Twillio`.  
Domain modules map to features: `Opportunity`, `MyOpportunity`, `Entity` (orgs/users), `Reward`, `SSI`, `Marketplace`, `ActionLink`, `Referral`, `Lookups`, etc.  
Background jobs run via Hangfire. Caching uses Valkey (Redis-compatible). Config is split across `appsettings.json` (committed defaults) and `appsettings.{Environment}.json` (env-specific overrides).

**`src/web/`** — Next.js 15 (Pages Router)  
Auth is NextAuth.js with a Keycloak provider (`src/server/auth.ts`). API calls go through a typed client layer in `src/api/`. Pages live under `src/pages/` — key routes: `/opportunities`, `/organisations`, `/admin`, `/marketplace`, `/yoid`, `/user`.

**`src/keycloak/`** — Keycloak 26 configuration-as-code  
Realm config is declared in `exports/01-yoma-realm.yaml` and applied at startup by `keycloak-config-cli`. SSO partner clients are defined in that YAML with env-var substitution (`$(env:CLIENT_X_URL)` syntax); corresponding env vars are set in `src/api/docker-compose.yml` under the `keycloak-config` service.  
Custom providers (phone auth, webhooks) are pre-built JARs in `providers/jars/` and copied into the Keycloak container at startup via `keycloak-init`.

## Adding a New SSO Partner

1. Add a new client block to `src/keycloak/exports/01-yoma-realm.yaml` (follow the `goodwall` client as a template).
2. Add the corresponding `CLIENT_X_*` env vars to the `keycloak-config` service in `src/api/docker-compose.yml`.
3. Add `<client-id>: []` to the `clientScopeMappings` roles section in the realm YAML.
4. Run `sudo docker compose up -d` — `keycloak-config-cli` re-applies the realm on every startup.

## Keycloak Public Exposure (ngrok)

When testing SSO with external partners locally, expose Keycloak via ngrok:

```sh
ngrok http 8081
```

Keycloak in `start-dev` mode infers its public hostname from request headers forwarded by ngrok — no config change needed. The OIDC discovery URL becomes:
`https://<ngrok-url>/realms/yoma/.well-known/openid-configuration`

Note: ngrok free-tier URLs change on restart.

# Cloud deployment

One-shot setup of both Yoma aggregator stacks (Chile Joven + P2E) on a fresh
Ubuntu 24.04 server.

## Prerequisites

* Ubuntu 24.04 server with at least 8 GB RAM / 4 vCPU / 80 GB SSD
  (Postgres × 2 + Keycloak × 2 + .NET API × 2 + Next.js × 2 + Valkey × 2 ≈ 6 GB
  resident at idle)
* SSH access as a sudoer
* The server's public IP

## Run

```sh
git clone https://github.com/kupsi/yoma.git
cd yoma
bash scripts/cloud/setup.sh <PUBLIC_IP>
```

For example:

```sh
bash scripts/cloud/setup.sh 178.128.31.178
```

The script will:

1. Install Docker, the Compose plugin, git, and python3 (if missing).
2. Create the gitignored `appsettings.Local.json` and `env.secrets` stubs.
3. Patch every `localhost` URL in both compose files + appsettings.json to
   the public IP.
4. Add `KC_HOSTNAME_URL` to both Keycloak services so issuer claims match
   what browsers see.
5. Bring up the Chile stack (`docker compose up -d --build`).
6. Bring up the P2E stack (`docker compose -f docker-compose.p2e.yml up -d
   --build`).
7. Wait for all six service health endpoints (Keycloak + API + Web for each).
8. Seed 80 courses from passport2earning.org into the P2E instance and
   soft-delete the post.sql demo noise.
9. Open ports 22, 3000, 3100, 5000, 5100, 8091, 8092 in ufw (if active).

Total runtime on a fresh 8 GB / 4 vCPU box is ~10–15 minutes — most of it is
the Next.js web build.

## What you get

| | URL |
|---|---|
| **Chile Joven** | `http://<PUBLIC_IP>:3000` |
| Chile API (Swagger) | `http://<PUBLIC_IP>:5000/swagger` |
| Chile Keycloak admin | `http://<PUBLIC_IP>:8091`  (admin / password) |
| **P2E** | `http://<PUBLIC_IP>:3100` |
| P2E API (Swagger) | `http://<PUBLIC_IP>:5100/swagger` |
| P2E Keycloak admin | `http://<PUBLIC_IP>:8092`  (admin / password) |

Demo accounts (both stacks):

* `testuser@gmail.com` · `P@ssword12`
* `testorgadminuser@gmail.com` · `P@ssword12`
* `testadminuser@gmail.com` · `P@ssword12`

## Idempotence

Re-running the script on the same server is safe:

* the env-var patches detect already-patched files and skip,
* `docker compose up -d` is a no-op on healthy stacks,
* `SKIP_SEED=1 bash scripts/cloud/setup.sh <IP>` skips the (slow) catalogue
  seed if you're just bouncing the stack.

## Tear down

```sh
sudo docker compose down                                  # Chile
sudo docker compose -f docker-compose.p2e.yml down        # P2E
```

Add `-v` to also drop the Postgres + Keycloak volumes.

## Not in scope

* TLS — everything is plain HTTP. To add it, drop in Caddy with two
  reverse-proxy blocks (see *docs/P2E_AGGREGATOR.md*).
* Rotated secrets — the demo passwords + client secrets in
  `01-yoma-realm.yaml` ship as-is. **Rotate before exposing this to anyone
  beyond yourself.**
* DNS — IP-only. Layer a domain on top later.

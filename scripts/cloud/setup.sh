#!/usr/bin/env bash
#
# One-shot setup for a fresh Ubuntu 24.04 server: brings up both the
# Chile Joven (yoma-v3) and the Passport-2-Earning (p2e-aggregator) stacks
# on the public IP supplied as the only argument.
#
# Usage:
#   git clone https://github.com/kupsi/yoma.git && cd yoma
#   bash scripts/cloud/setup.sh 178.128.31.178
#
# Idempotent enough to re-run: docker compose up -d is harmless on already-up
# stacks, the env patching is guarded against double-patching, and the
# seeding step is opt-out via SKIP_SEED=1.
#
# Resulting URLs (HTTP, no TLS — see docs/P2E_AGGREGATOR.md for the Caddy
# upgrade path):
#   Chile Joven:  http://<IP>:3000   (API :5000, Keycloak :8091)
#   P2E:          http://<IP>:3100   (API :5100, Keycloak :8092)

set -euo pipefail

PUB_IP="${1:-}"
if [[ -z "$PUB_IP" ]]; then
  echo "usage: $0 <public-ip>"
  exit 2
fi

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

# ── 0. cosmetics ────────────────────────────────────────────────────────────
say() { printf "\n\033[1;36m▶ %s\033[0m\n" "$*"; }
warn() { printf "\033[1;33m⚠ %s\033[0m\n" "$*"; }

# ── 1. Install Docker + Compose + git + python (if missing) ────────────────
if ! command -v docker >/dev/null; then
  say "Installing Docker, Compose plugin, git, python3..."
  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
    docker.io docker-compose-plugin git python3
  sudo systemctl enable --now docker
  sudo usermod -aG docker "$USER"
  warn "Added $USER to the docker group. If subsequent docker commands fail with 'permission denied', log out and back in (or run 'newgrp docker') and re-run this script."
else
  say "Docker already installed: $(docker --version)"
fi

# ── 2. Required gitignored files ───────────────────────────────────────────
APPSET="src/api/src/application/Yoma.Core.Api/appsettings.Local.json"
if [[ ! -f "$APPSET" ]]; then
  say "Creating placeholder $APPSET"
  cat > "$APPSET" <<'JSON'
{
  "AppSettings": {
    "YomaOrganizationName": "Yoma",
    "YomaSupportEmailAddress": "support@yoma.world",
    "SSISchemaFullNameYoID": "YoID"
  }
}
JSON
fi
[[ -f src/api/env.secrets ]] || { say "Creating empty src/api/env.secrets"; echo '# empty' > src/api/env.secrets; }

# ── 3. Patch localhost → public IP, plus stamp KC_HOSTNAME_URL ─────────────
say "Patching env vars to use public IP $PUB_IP..."
patch_inplace() {
  local file=$1 from=$2 to=$3
  # Skip if already patched
  if grep -q -F "$to" "$file" && ! grep -q -F "$from" "$file"; then
    echo "  · $file: already patched"
    return
  fi
  sed -i "s|$from|$to|g" "$file"
  echo "  · $file: $from -> $to"
}

patch_inplace src/api/docker-compose.yml             "http://localhost:5000" "http://${PUB_IP}:5000"
patch_inplace src/api/docker-compose.yml             "http://localhost:3000" "http://${PUB_IP}:3000"
patch_inplace src/web/docker-compose.yml             "http://localhost:5000" "http://${PUB_IP}:5000"
patch_inplace src/web/docker-compose.yml             "http://localhost:3000" "http://${PUB_IP}:3000"
patch_inplace src/web/docker-compose.yml             "NEXTAUTH_URL: http://localhost:3000" "NEXTAUTH_URL: http://${PUB_IP}:3000"
patch_inplace src/web/docker-compose.yml             "KEYCLOAK_ISSUER: http://keycloak:8091/realms/yoma" "KEYCLOAK_ISSUER: http://${PUB_IP}:8091/realms/yoma"
patch_inplace src/api/src/application/Yoma.Core.Api/appsettings.json \
                                                    "\"AuthServerUrl\": \"http://keycloak:8091\"" \
                                                    "\"AuthServerUrl\": \"http://${PUB_IP}:8091\""

patch_inplace docker-compose.p2e.yml                 "http://localhost:5100" "http://${PUB_IP}:5100"
patch_inplace docker-compose.p2e.yml                 "http://localhost:3100" "http://${PUB_IP}:3100"
patch_inplace docker-compose.p2e.yml                 "NEXTAUTH_URL: http://localhost:3100" "NEXTAUTH_URL: http://${PUB_IP}:3100"
patch_inplace docker-compose.p2e.yml                 "KEYCLOAK_ISSUER: http://p2e-keycloak:8092/realms/yoma" "KEYCLOAK_ISSUER: http://${PUB_IP}:8092/realms/yoma"
patch_inplace docker-compose.p2e.yml                 "Keycloak__AuthServerUrl: \"http://p2e-keycloak:8092\"" \
                                                    "Keycloak__AuthServerUrl: \"http://${PUB_IP}:8092\""

# ── 4. Add KC_HOSTNAME_URL so Keycloak stamps the public hostname into iss ─
# (commented out in source because the local dev path uses the docker hostname)
say "Ensuring KC_HOSTNAME_URL is set on both Keycloak services..."
python3 - <<PY
import re, pathlib
PUB = "${PUB_IP}"

def stamp(path, port):
    p = pathlib.Path(path)
    text = p.read_text()
    target_url = f"KC_HOSTNAME_URL: \"http://{PUB}:{port}\""
    if target_url in text:
        print(f"  · {path}: KC_HOSTNAME_URL already set"); return
    # If a (possibly commented-out) prior line exists, replace it; otherwise
    # insert right after KC_HEALTH_ENABLED to keep diff minimal.
    new_block = (
        f'      {target_url}\n'
        f'      KC_HOSTNAME_ADMIN_URL: "http://{PUB}:{port}"\n'
    )
    # remove any existing (commented or uncommented) KC_HOSTNAME_URL/ADMIN_URL lines
    text = re.sub(r'^\s*#?\s*KC_HOSTNAME(_ADMIN)?_URL:.*\n', '', text, flags=re.M)
    text = re.sub(
        r'(KC_HEALTH_ENABLED:\s*\S+\s*\n)',
        r'\1' + new_block,
        text, count=1,
    )
    p.write_text(text)
    print(f"  · {path}: stamped KC_HOSTNAME_URL=http://{PUB}:{port}")

stamp("src/api/docker-compose.yml", 8091)
stamp("docker-compose.p2e.yml",     8092)
PY

# ── 5. Bring up Chile stack (Postgres, Valkey, Keycloak, API, Web) ─────────
say "Building + starting Chile stack..."
sudo docker compose up -d --build

# Wait for Chile health endpoints; we want both Keycloak and API ready before
# touching P2E so the build context isn't fighting for memory.
wait_http() {
  local url=$1 want=$2
  for _ in $(seq 1 60); do
    code=$(curl -s -o /dev/null -w "%{http_code}" "$url" || true)
    [[ "$code" =~ ^${want}$ ]] && return 0
    sleep 5
  done
  warn "Timed out waiting for $url (last status $code)"
  return 1
}
say "Waiting for Chile services to come up..."
wait_http "http://${PUB_IP}:8091/realms/yoma/.well-known/openid-configuration" 200
wait_http "http://${PUB_IP}:5000/api/v3/lookup/timeInterval"                   200
wait_http "http://${PUB_IP}:3000/"                                             200

# ── 6. Bring up P2E stack ──────────────────────────────────────────────────
say "Building + starting P2E stack (uses NEXT_PUBLIC_BRAND=p2e build arg)..."
sudo docker compose -f docker-compose.p2e.yml up -d --build

say "Waiting for P2E services to come up..."
wait_http "http://${PUB_IP}:8092/realms/yoma/.well-known/openid-configuration" 200
wait_http "http://${PUB_IP}:5100/api/v3/lookup/timeInterval"                   200
wait_http "http://${PUB_IP}:3100/"                                             200

# ── 7. Seed the P2E catalogue (80 courses from passport2earning.org) ───────
if [[ "${SKIP_SEED:-0}" == "1" ]]; then
  warn "SKIP_SEED=1 set — not seeding P2E content."
else
  say "Seeding 80 P2E Global Library courses into the P2E instance..."
  # Inside the docker network so it can resolve p2e-keycloak / p2e-api by hostname.
  NET=$(docker network ls --format '{{.Name}}' | grep p2e-net | head -1)
  if [[ -z "$NET" ]]; then
    warn "Could not find the p2e docker network; skipping seed."
  else
    docker run --rm --network "$NET" \
      -v "${REPO_ROOT}/scripts/cloud/seed_p2e_global.py:/s.py:ro" \
      -v "${REPO_ROOT}/scripts/cloud/p2e_courses.json:/courses.json:ro" \
      python:3.12-alpine python3 /s.py

    say "Cleaning out post.sql demo data so only the real 80 courses remain..."
    docker run --rm --network "$NET" \
      -v "${REPO_ROOT}/scripts/cloud/cleanup_p2e.py:/c.py:ro" \
      -v "${REPO_ROOT}/scripts/cloud/p2e_courses.json:/courses.json:ro" \
      python:3.12-alpine python3 /c.py
  fi
fi

# ── 8. Firewall ────────────────────────────────────────────────────────────
if command -v ufw >/dev/null && sudo ufw status | grep -q "Status: active"; then
  say "Opening firewall ports (ufw)..."
  for p in 22 3000 3100 5000 5100 8091 8092; do
    sudo ufw allow "${p}/tcp" >/dev/null
  done
fi

# ── done ───────────────────────────────────────────────────────────────────
cat <<EOF

╭─────────────────────────────────────────────────────────────────────╮
│  Both stacks are up.                                                │
│                                                                     │
│  Chile Joven  →  http://${PUB_IP}:3000$(printf '%*s' $((23 - ${#PUB_IP})) '')│
│  P2E          →  http://${PUB_IP}:3100$(printf '%*s' $((23 - ${#PUB_IP})) '')│
│                                                                     │
│  Demo accounts (both stacks, same passwords):                       │
│    testuser@gmail.com         · P@ssword12                          │
│    testorgadminuser@gmail.com · P@ssword12                          │
│    testadminuser@gmail.com    · P@ssword12                          │
│                                                                     │
│  These are exposed on the public internet over plain HTTP.          │
│  Treat as a demo, not a production deployment. Rotate secrets       │
│  and put Caddy + TLS in front before sharing widely.                │
╰─────────────────────────────────────────────────────────────────────╯
EOF

#!/usr/bin/env bash
#
# Install Claude Code (Anthropic's CLI) on the cloud server.
#
# Usage:
#   bash scripts/cloud/install-claude.sh
#
# After install, set your API key (or skip and use the interactive
# Claude.ai OAuth flow when you first run `claude`):
#
#   export ANTHROPIC_API_KEY=sk-ant-...
#   # to persist:
#   echo 'export ANTHROPIC_API_KEY=sk-ant-...' >> ~/.bashrc
#
# Then from inside the repo:
#   cd ~/yoma
#   claude
#
# The CLAUDE.md and scripts/cloud/HANDOFF.md files in the repo brief any
# fresh Claude session on what this server is and what state it's in.

set -euo pipefail

say()  { printf "\n\033[1;36m▶ %s\033[0m\n" "$*"; }
warn() { printf "\033[1;33m⚠ %s\033[0m\n" "$*"; }

# Prefer the upstream installer (no Node required). Falls back to npm.
if command -v claude >/dev/null; then
  say "Claude Code already installed: $(claude --version 2>&1 | head -1)"
  exit 0
fi

say "Installing Claude Code via the upstream installer..."
if curl -fsSL https://claude.ai/install.sh | bash; then
  # Installer drops the binary in ~/.local/bin or similar; ensure it's on PATH.
  for d in "$HOME/.local/bin" "$HOME/.claude/bin"; do
    [[ -d "$d" ]] && case ":$PATH:" in
      *":$d:"*) ;;
      *)
        echo "export PATH=\"$d:\$PATH\"" >> ~/.bashrc
        export PATH="$d:$PATH"
        ;;
    esac
  done
else
  warn "Upstream installer failed. Falling back to npm install."
  if ! command -v node >/dev/null; then
    say "Installing Node.js 20 (NodeSource repo)..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
  fi
  sudo npm install -g @anthropic-ai/claude-code
fi

if command -v claude >/dev/null; then
  say "Claude Code installed: $(claude --version 2>&1 | head -1)"
else
  warn "Install finished but \`claude\` is not on PATH. Open a new shell or run: source ~/.bashrc"
  exit 1
fi

cat <<'EOF'

Next steps
──────────
1. Get an API key from https://console.anthropic.com/settings/keys
2. Export it (and persist):
     export ANTHROPIC_API_KEY=sk-ant-...
     echo 'export ANTHROPIC_API_KEY=sk-ant-...' >> ~/.bashrc
3. Run claude from inside the repo:
     cd ~/yoma && claude
4. It will pick up CLAUDE.md and scripts/cloud/HANDOFF.md automatically and
   already know what this server is.

Optional: paste your /loop, /code-review or similar slash commands from your
local laptop into ~/.claude/skills/ on the server for parity.
EOF

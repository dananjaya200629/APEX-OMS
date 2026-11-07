#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if [ -f .env ]; then
  set -a
  # .env must contain simple KEY=value lines; do not put shell commands in it.
  . ./.env
  set +a
fi
export APEX_HOST="${APEX_HOST:-127.0.0.1}"
export APEX_PORT="${APEX_PORT:-8765}"
export APEX_COOKIE_SECURE="${APEX_COOKIE_SECURE:-false}"
export APEX_DATA_DIR="${APEX_DATA_DIR:-$PWD/data}"
python3 -m pip install -r requirements.txt
exec python3 server.py

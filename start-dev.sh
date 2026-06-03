#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "RealTimeVowelSpace launcher"
echo

bash "$ROOT/scripts/ensure_prereqs.sh"

if [[ -x "$ROOT/backend/.venv/bin/python" ]]; then
  "$ROOT/backend/.venv/bin/python" "$ROOT/scripts/bootstrap_dev.py"
elif command -v python3.12 >/dev/null 2>&1; then
  python3.12 "$ROOT/scripts/bootstrap_dev.py"
elif command -v python3 >/dev/null 2>&1; then
  python3 "$ROOT/scripts/bootstrap_dev.py"
elif command -v python >/dev/null 2>&1; then
  python "$ROOT/scripts/bootstrap_dev.py"
else
  echo "Python was not found. Install Python 3.12 or newer, then run this launcher again."
  exit 1
fi

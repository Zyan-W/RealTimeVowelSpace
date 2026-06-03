#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
need_python=0
need_node=0

has_python() {
  [[ -x "$ROOT/backend/.venv/bin/python" ]] && check_python "$ROOT/backend/.venv/bin/python" && return 0
  command -v python3.12 >/dev/null 2>&1 && check_python "$(command -v python3.12)" && return 0
  command -v python3 >/dev/null 2>&1 && check_python "$(command -v python3)" && return 0
  command -v python >/dev/null 2>&1 && check_python "$(command -v python)" && return 0
  return 1
}

check_python() {
  "$1" -c 'import sys; raise SystemExit(0 if sys.version_info >= (3, 12) else 1)' >/dev/null 2>&1
}

has_node() {
  command -v npm >/dev/null 2>&1 && return 0
  return 1
}

if ! has_python; then
  need_python=1
fi

if ! has_node; then
  need_node=1
fi

if [[ "$need_python$need_node" == "00" ]]; then
  exit 0
fi

echo "Missing required runtime(s):"
if [[ "$need_python" == "1" ]]; then
  echo "- Python 3.12 or newer"
fi
if [[ "$need_node" == "1" ]]; then
  echo "- Node.js LTS"
fi
echo

if ! command -v brew >/dev/null 2>&1; then
  echo "Homebrew was not found, so this launcher cannot install system runtimes automatically."
  echo "Install Python 3.12 or newer and Node.js LTS manually, then run bash start-dev.sh again."
  exit 1
fi

if [[ "${RVWS_AUTO_INSTALL_PREREQS:-}" == "1" ]]; then
  answer="y"
else
  read -r -p "Install the missing runtime(s) now with Homebrew? [y/N] " answer
fi

case "$answer" in
  y|Y|yes|YES)
    ;;
  *)
    echo "Installation canceled. Install the missing runtime(s), then run bash start-dev.sh again."
    exit 1
    ;;
esac

if [[ "$need_python" == "1" ]]; then
  echo
  echo "Installing Python with Homebrew..."
  brew install python
fi

if [[ "$need_node" == "1" ]]; then
  echo
  echo "Installing Node.js with Homebrew..."
  brew install node
fi

echo
echo "Runtime installation finished."
echo "If the launcher still cannot find Python or Node.js, close this terminal and run bash start-dev.sh again."

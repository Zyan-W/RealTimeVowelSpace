from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT / "backend"
FRONTEND_DIR = ROOT / "frontend"
MIN_PYTHON = (3, 12)


def main() -> int:
    ensure_supported_python()
    backend_py = backend_python_path()
    if not backend_py.exists():
        print("Backend environment was not found. Creating backend/.venv...", flush=True)
        create_backend_venv()

    print("Installing or refreshing backend packages...", flush=True)
    run([str(backend_py), "-m", "pip", "install", "-r", str(BACKEND_DIR / "requirements.txt")])

    npm = find_npm()
    if not (FRONTEND_DIR / "node_modules").exists():
        print("Frontend packages were not found. Running npm install...", flush=True)
        run([str(npm), "install"], cwd=FRONTEND_DIR)

    print("", flush=True)
    print("Starting RealTimeVowelSpace...", flush=True)
    return subprocess.call([str(backend_py), str(ROOT / "scripts" / "dev_launcher.py")], env=clean_python_env())


def backend_python_path() -> Path:
    if os.name == "nt":
        return BACKEND_DIR / ".venv" / "Scripts" / "python.exe"
    return BACKEND_DIR / ".venv" / "bin" / "python"


def create_backend_venv() -> None:
    python = find_python_for_venv()
    run([*python, "-m", "venv", str(BACKEND_DIR / ".venv")])


def find_python_for_venv() -> list[str]:
    if sys.version_info >= MIN_PYTHON:
        return [sys.executable]

    if os.name == "nt" and shutil.which("py"):
        return ["py", "-3"]

    if os.name == "nt":
        local_python = Path(os.environ.get("LocalAppData", "")) / "Programs" / "Python" / "Python312" / "python.exe"
        if local_python.exists():
            return [str(local_python)]

    for executable in ("python3", "python"):
        if shutil.which(executable):
            return [executable]
    raise SystemExit("Python was not found. Install Python 3.12 or newer, then run this launcher again.")


def ensure_supported_python() -> None:
    if sys.version_info >= MIN_PYTHON:
        return
    version = ".".join(str(part) for part in sys.version_info[:3])
    raise SystemExit(f"Python {version} is too old. Install Python 3.12 or newer, then run this launcher again.")


def find_npm() -> Path:
    if os.name == "nt":
        candidates = [
            Path(os.environ.get("ProgramFiles", "")) / "nodejs" / "npm.cmd",
            Path(os.environ.get("ProgramFiles(x86)", "")) / "nodejs" / "npm.cmd",
        ]
        for candidate in candidates:
            if candidate.exists():
                return candidate

    for executable in ("npm.cmd", "npm"):
        found = shutil.which(executable)
        if found:
            return Path(found)

    raise SystemExit("npm was not found. Install Node.js LTS, close this terminal, then run this launcher again.")


def clean_python_env() -> dict[str, str]:
    env = os.environ.copy()
    env.pop("PYTHONUTF8", None)
    env.pop("PYTHONIOENCODING", None)
    return env


def run(command: list[str], cwd: Path | None = None) -> None:
    subprocess.run(command, cwd=cwd, env=clean_python_env(), check=True)


if __name__ == "__main__":
    raise SystemExit(main())

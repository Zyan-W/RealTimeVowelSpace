from __future__ import annotations

import os
import shutil
import socket
import subprocess
import time
import urllib.request
import webbrowser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT / "backend"
FRONTEND_DIR = ROOT / "frontend"
BACKEND_PY = BACKEND_DIR / ".venv" / "Scripts" / "python.exe"
VITE_JS = FRONTEND_DIR / "node_modules" / "vite" / "bin" / "vite.js"


def main() -> int:
    node = find_node()
    ensure_file(BACKEND_PY, "Backend Python was not found. Run start-dev.cmd again.")
    ensure_file(VITE_JS, "Frontend packages were not found. Run start-dev.cmd so it can install them.")

    backend_port = find_available_port(8000)
    frontend_port = find_available_port(5173)

    backend_env = os.environ.copy()
    backend_env.pop("PYTHONUTF8", None)
    backend_env.pop("PYTHONIOENCODING", None)
    frontend_env = os.environ.copy()
    frontend_env["BACKEND_PORT"] = str(backend_port)

    backend = subprocess.Popen(
        [str(BACKEND_PY), "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", str(backend_port)],
        cwd=BACKEND_DIR,
        env=backend_env,
    )
    frontend = subprocess.Popen(
        [str(node), str(VITE_JS), "--host", "127.0.0.1", "--port", str(frontend_port), "--strictPort"],
        cwd=FRONTEND_DIR,
        env=frontend_env,
    )

    try:
        page_url = f"http://localhost:{frontend_port}"
        wait_for_url(f"http://127.0.0.1:{backend_port}/api/health", backend, "backend")
        wait_for_url(f"http://127.0.0.1:{frontend_port}", frontend, "frontend")
        wait_for_url(f"http://127.0.0.1:{frontend_port}/api/corpora", frontend, "frontend API proxy")
        print("")
        print("RealTimeVowelSpace is ready.")
        print(f"Backend API: http://localhost:{backend_port}")
        print(f"Browser URL: {page_url}")
        print("Press Ctrl+C in this window to stop both services.")
        print("")
        if os.environ.get("RVWS_SMOKE_TEST") == "1":
            return 0
        webbrowser.open(page_url)
        while True:
            exited = []
            if backend.poll() is not None:
                exited.append(f"backend exited with code {backend.returncode}")
            if frontend.poll() is not None:
                exited.append(f"frontend exited with code {frontend.returncode}")
            if exited:
                print("; ".join(exited))
                return 1
            time.sleep(1)
    except KeyboardInterrupt:
        print("")
        print("Stopping RealTimeVowelSpace...")
        return 0
    finally:
        terminate(backend)
        terminate(frontend)


def find_node() -> Path:
    candidates = [
        Path(os.environ.get("ProgramFiles", "")) / "nodejs" / "node.exe",
        Path(os.environ.get("ProgramFiles(x86)", "")) / "nodejs" / "node.exe",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    found = shutil.which("node.exe")
    if found:
        return Path(found)
    raise SystemExit("node.exe was not found. Install Node.js LTS, then run start-dev.cmd again.")


def ensure_file(path: Path, message: str) -> None:
    if not path.exists():
        raise SystemExit(message)


def find_available_port(preferred: int) -> int:
    for port in range(preferred, preferred + 50):
        if not is_port_open(port):
            return port
    raise SystemExit(f"No free local port was found near {preferred}. Close old service windows and try again.")


def is_port_open(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.25)
        return sock.connect_ex(("127.0.0.1", port)) == 0


def wait_for_url(url: str, process: subprocess.Popen[bytes], label: str) -> None:
    deadline = time.time() + 45
    while time.time() < deadline:
        if process.poll() is not None:
            raise SystemExit(f"The {label} service exited early with code {process.returncode}.")
        try:
            with urllib.request.urlopen(url, timeout=1) as response:
                if response.status < 500:
                    response.read(256)
                    return
        except Exception:
            time.sleep(0.5)
    raise SystemExit(f"The {label} service did not become ready in time.")


def terminate(process: subprocess.Popen[bytes]) -> None:
    if process.poll() is not None:
        return
    process.terminate()
    try:
        process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        process.kill()


if __name__ == "__main__":
    raise SystemExit(main())

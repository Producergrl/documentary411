"""
PyInstaller build helper.
Run with:  python build.py
Detects the current OS and invokes the correct PyInstaller command.

Requirements before running:
  1. pip install -r requirements.txt
  2. Populate GUMROAD_PRODUCT_ID, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
     MICROSOFT_CLIENT_ID in your environment or a local .env file.
  3. Ensure client_secrets.json (Google OAuth desktop credentials) exists
     in the project root.
  4. Ensure assets/icon.icns (Mac) and assets/icon.ico (Windows) exist.
"""

import os
import platform
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).parent


def _require_env(name: str) -> str:
    val = os.environ.get(name, "").strip()
    if not val:
        print(f"ERROR: {name} is not set. Set it before building.")
        sys.exit(1)
    return val


def _check_file(path: Path) -> None:
    if not path.exists():
        print(f"ERROR: Required file not found: {path}")
        sys.exit(1)


def main() -> None:
    system = platform.system()
    print(f"Building GrantAndFundScraper for {system}…\n")

    # Validate build-time secrets
    gumroad_id        = _require_env("GUMROAD_PRODUCT_ID")
    google_client_id  = _require_env("GOOGLE_CLIENT_ID")
    google_secret     = _require_env("GOOGLE_CLIENT_SECRET")
    ms_client_id      = _require_env("MICROSOFT_CLIENT_ID")
    ms_tenant_id      = os.environ.get("MICROSOFT_TENANT_ID", "common")
    flask_secret      = os.environ.get("FLASK_SECRET_KEY") or os.urandom(32).hex()

    _check_file(ROOT / "client_secrets.json")

    if system == "Darwin":
        icon = str(ROOT / "assets" / "icon.icns")
        _check_file(Path(icon))
    elif system == "Windows":
        icon = str(ROOT / "assets" / "icon.ico")
        _check_file(Path(icon))
    else:
        icon = ""  # Linux: no bundled icon required

    # Data files to bundle: templates dir + client_secrets.json
    sep = ";" if system == "Windows" else ":"
    add_data = [
        f"app/templates{sep}app/templates",
        f"client_secrets.json{sep}.",
    ]

    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--onefile",
        "--windowed",
        "--name", "GrantAndFundScraper",
        "--clean",
    ]

    if icon:
        cmd += ["--icon", icon]

    for ad in add_data:
        cmd += ["--add-data", ad]

    # Inject build-time env vars via --add-binary is not clean —
    # instead we write them as PyInstaller runtime hooks via --runtime-hook.
    # We generate a small hook file on the fly.
    hook_path = ROOT / "_build_env_hook.py"
    hook_path.write_text(
        f"""import os
os.environ.setdefault('GUMROAD_PRODUCT_ID', {gumroad_id!r})
os.environ.setdefault('GOOGLE_CLIENT_ID', {google_client_id!r})
os.environ.setdefault('GOOGLE_CLIENT_SECRET', {google_secret!r})
os.environ.setdefault('MICROSOFT_CLIENT_ID', {ms_client_id!r})
os.environ.setdefault('MICROSOFT_TENANT_ID', {ms_tenant_id!r})
os.environ.setdefault('FLASK_SECRET_KEY', {flask_secret!r})
""",
        encoding="utf-8",
    )

    cmd += ["--runtime-hook", str(hook_path)]
    cmd.append("main.py")

    print("Running:", " ".join(cmd))
    result = subprocess.run(cmd, cwd=str(ROOT))

    hook_path.unlink(missing_ok=True)

    if result.returncode == 0:
        print("\nBuild succeeded.")
        if system == "Darwin":
            print("Output: dist/GrantAndFundScraper  (or dist/GrantAndFundScraper.app)")
        else:
            print("Output: dist/GrantAndFundScraper.exe")
    else:
        print("\nBuild FAILED. Check output above.")
        sys.exit(1)


if __name__ == "__main__":
    main()

from __future__ import annotations

import argparse
import os
import subprocess
import time
from pathlib import Path

from remote import RemoteHost, SSHConfig


REPO_ROOT = Path(__file__).resolve().parents[1]
MOBILE_ROOT = REPO_ROOT / "artifacts" / "mobile"
DEFAULT_DOWNLOAD_DIR = "/var/www/loca-auto-downloads"
DEFAULT_DOMAIN = "demo-locationauto.shonenx.shop"


def env_or_default(name: str, default: str | None = None) -> str | None:
    value = os.environ.get(name)
    return value if value not in {None, ""} else default


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Build and publish the Android APK.")
    parser.add_argument("--host", default=env_or_default("DEPLOY_HOST"))
    parser.add_argument("--user", default=env_or_default("DEPLOY_USER", "root"))
    parser.add_argument("--password", default=env_or_default("DEPLOY_PASSWORD"))
    parser.add_argument("--port", type=int, default=int(env_or_default("DEPLOY_PORT", "22")))
    parser.add_argument("--domain", default=env_or_default("DEPLOY_DOMAIN", DEFAULT_DOMAIN))
    parser.add_argument(
        "--download-dir",
        default=env_or_default("DEPLOY_DOWNLOAD_DIR", DEFAULT_DOWNLOAD_DIR),
    )
    return parser


def run_command(
    command: list[str],
    *,
    cwd: Path,
    env: dict[str, str] | None = None,
) -> None:
    merged_env = os.environ.copy()
    if env:
        merged_env.update(env)

    subprocess.run(command, cwd=cwd, env=merged_env, check=True)


def build_android_apk() -> Path:
    deploy_domain = os.environ.get("DEPLOY_DOMAIN", DEFAULT_DOMAIN)
    run_command(
        [
            "pnpm",
            "--filter",
            "@workspace/mobile",
            "exec",
            "expo",
            "prebuild",
            "--platform",
            "android",
            "--clean",
            "--non-interactive",
            "--no-install",
            "--skip-dependency-update",
            "react-native,react",
        ],
        cwd=REPO_ROOT,
        env={
            "EXPO_PUBLIC_API_BASE_URL": os.environ.get(
                "EXPO_PUBLIC_API_BASE_URL",
                f"https://{deploy_domain}",
            ),
            "EXPO_PUBLIC_DOMAIN": os.environ.get("EXPO_PUBLIC_DOMAIN", deploy_domain),
        },
    )

    android_root = MOBILE_ROOT / "android"
    gradle_command = ["./gradlew", "--no-daemon", "assembleDebug"]
    if os.name == "nt":
        gradle_command = ["gradlew.bat", "--no-daemon", "assembleDebug"]

    run_command(
        gradle_command,
        cwd=android_root,
    )

    apk_path = android_root / "app" / "build" / "outputs" / "apk" / "debug" / "app-debug.apk"
    if not apk_path.exists():
        candidates = sorted(android_root.rglob("*.apk"))
        if not candidates:
            raise FileNotFoundError("No APK was produced by the Android build")
        apk_path = candidates[-1]

    return apk_path


def render_download_index(domain: str, apk_name: str, build_label: str) -> str:
    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Location Auto Maroc APK</title>
    <style>
      :root {{
        color-scheme: dark;
        --bg: #08111f;
        --card: rgba(12, 21, 39, 0.88);
        --border: rgba(148, 163, 184, 0.18);
        --text: #f8fafc;
        --muted: #94a3b8;
        --accent: #f59e0b;
      }}
      * {{ box-sizing: border-box; }}
      body {{
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background:
          radial-gradient(circle at top, rgba(245, 158, 11, 0.24), transparent 28%),
          radial-gradient(circle at bottom right, rgba(14, 165, 233, 0.18), transparent 24%),
          linear-gradient(180deg, #050816 0%, var(--bg) 100%);
        color: var(--text);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }}
      .card {{
        width: min(92vw, 760px);
        padding: 32px;
        border: 1px solid var(--border);
        border-radius: 28px;
        background: var(--card);
        box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35);
        backdrop-filter: blur(16px);
      }}
      .eyebrow {{
        text-transform: uppercase;
        letter-spacing: .18em;
        color: var(--accent);
        font-size: .76rem;
        margin: 0 0 12px;
      }}
      h1 {{
        margin: 0;
        font-size: clamp(2rem, 5vw, 3.8rem);
        line-height: 1;
      }}
      p {{
        color: var(--muted);
        font-size: 1rem;
        line-height: 1.6;
      }}
      .actions {{
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 24px;
      }}
      a {{
        text-decoration: none;
      }}
      .button {{
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 48px;
        padding: 0 18px;
        border-radius: 999px;
        font-weight: 700;
      }}
      .primary {{
        background: var(--accent);
        color: #111827;
      }}
      .secondary {{
        border: 1px solid var(--border);
        color: var(--text);
        background: rgba(15, 23, 42, 0.5);
      }}
      .meta {{
        display: grid;
        gap: 6px;
        margin-top: 28px;
        font-size: 0.95rem;
        color: var(--muted);
      }}
      code {{
        color: var(--text);
      }}
    </style>
  </head>
  <body>
    <main class="card">
      <p class="eyebrow">Mobile APK Portal</p>
      <h1>Location Auto Maroc</h1>
      <p>Download the latest Android APK or open the live web app on the same server.</p>
      <div class="actions">
        <a class="button primary" href="./{apk_name}">Download latest APK</a>
        <a class="button secondary" href="https://{domain}/">Open web app</a>
      </div>
      <div class="meta">
        <div>Latest build: <code>{build_label}</code></div>
        <div>Stable file: <code>{apk_name}</code></div>
      </div>
    </main>
  </body>
</html>
"""


def publish_apk(remote: RemoteHost, apk_path: Path, domain: str, download_dir: str) -> str:
    remote.ensure_dir(download_dir)

    build_label = os.environ.get("GITHUB_SHA", "").strip()[:8] or time.strftime("%Y%m%d-%H%M%S")
    stable_name = "latest.apk"
    versioned_name = f"location-auto-mobile-{build_label}.apk"

    remote.upload_file(apk_path, f"{download_dir}/{stable_name}")
    remote.upload_file(apk_path, f"{download_dir}/{versioned_name}")
    remote.write_text(
        f"{download_dir}/index.html",
        render_download_index(domain, stable_name, build_label),
    )

    return stable_name


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    if not args.host:
        raise SystemExit("DEPLOY_HOST is required")
    if not args.password:
        raise SystemExit("DEPLOY_PASSWORD is required")

    apk_path = build_android_apk()

    with RemoteHost(
        SSHConfig(
            host=args.host,
            username=args.user,
            password=args.password,
            port=args.port,
        ),
    ) as remote:
        stable_name = publish_apk(remote, apk_path, args.domain, args.download_dir)

    print(f"Published APK: https://{args.domain}/downloads/{stable_name}")


if __name__ == "__main__":
    main()

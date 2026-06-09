from __future__ import annotations

import argparse
import os
import secrets
import subprocess
import tarfile
import tempfile
import shlex
from pathlib import Path

from bootstrap_server import bootstrap_server
from remote import RemoteHost, SSHConfig, render_env_file


REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DOMAIN = "demo-locationauto.shonenx.shop"
DEFAULT_APP_DIR = "/opt/loca-auto"
DEFAULT_STATE_DIR = "/opt/loca-auto-state"
SEED_MARKER = "demo-seeded"


def env_or_default(name: str, default: str | None = None) -> str | None:
    value = os.environ.get(name)
    return value if value not in {None, ""} else default


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Deploy the app to the remote server.")
    parser.add_argument("--host", default=env_or_default("DEPLOY_HOST"))
    parser.add_argument("--user", default=env_or_default("DEPLOY_USER", "root"))
    parser.add_argument("--password", default=env_or_default("DEPLOY_PASSWORD"))
    parser.add_argument("--port", type=int, default=int(env_or_default("DEPLOY_PORT", "22")))
    parser.add_argument("--domain", default=env_or_default("DEPLOY_DOMAIN", DEFAULT_DOMAIN))
    parser.add_argument("--app-dir", default=env_or_default("DEPLOY_PATH", DEFAULT_APP_DIR))
    parser.add_argument(
        "--state-dir",
        default=env_or_default("DEPLOY_STATE_DIR", DEFAULT_STATE_DIR),
    )
    return parser


def git_tracked_and_untracked_files(repo_root: Path) -> list[Path]:
    result = subprocess.run(
        [
            "git",
            "-C",
            str(repo_root),
            "ls-files",
            "-co",
            "--exclude-standard",
        ],
        check=True,
        capture_output=True,
        text=True,
    )

    files: list[Path] = []
    for line in result.stdout.splitlines():
        candidate = line.strip()
        if candidate:
            files.append(repo_root / candidate)

    return files


def create_source_archive(repo_root: Path) -> Path:
    fd, temp_path = tempfile.mkstemp(suffix=".tar.gz")
    os.close(fd)
    archive_path = Path(temp_path)

    try:
        with tarfile.open(archive_path, "w:gz") as archive:
            for file_path in git_tracked_and_untracked_files(repo_root):
                if file_path.is_file() or file_path.is_symlink():
                    archive.add(file_path, arcname=file_path.relative_to(repo_root))
        return archive_path
    except Exception:
        archive_path.unlink(missing_ok=True)
        raise


def parse_env_file(contents: str) -> dict[str, str]:
    env: dict[str, str] = {}
    for raw_line in contents.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()

        if value and value[0] in {'"', "'"} and value[-1] == value[0]:
            try:
                import json

                value = json.loads(value)
            except Exception:
                value = value[1:-1]

        env[key] = value

    return env


def parse_smtp_host_port(raw_value: str | None) -> tuple[str | None, str | None]:
    if not raw_value:
        return None, None

    value = raw_value.strip()
    if ":" not in value:
        return value, None

    host, port = value.rsplit(":", 1)
    if not host or not port.isdigit():
        return value, None

    return host, port


def generate_env(remote: RemoteHost, app_dir: str) -> dict[str, str]:
    env_path = f"{app_dir}/.env"
    existing = parse_env_file(remote.read_text(env_path)) if remote.exists(env_path) else {}

    postgres_db = (
        os.environ.get("POSTGRES_DB")
        or existing.get("POSTGRES_DB")
        or "moroccan_food_hub"
    )
    postgres_user = (
        os.environ.get("POSTGRES_USER")
        or existing.get("POSTGRES_USER")
        or "app"
    )
    postgres_password = (
        os.environ.get("POSTGRES_PASSWORD")
        or existing.get("POSTGRES_PASSWORD")
        or secrets.token_urlsafe(24)
    )
    session_secret = (
        os.environ.get("SESSION_SECRET")
        or existing.get("SESSION_SECRET")
        or secrets.token_urlsafe(48)
    )

    raw_smtp_smarthost = (
        os.environ.get("SMTP_SMARTHOST")
        or existing.get("SMTP_SMARTHOST")
        or ""
    )
    raw_smtp_host = (
        os.environ.get("SMTP_HOST")
        or existing.get("SMTP_HOST")
        or ""
    )
    smtp_host, inferred_port = parse_smtp_host_port(raw_smtp_smarthost or raw_smtp_host)
    smtp_port = (
        os.environ.get("SMTP_PORT")
        or existing.get("SMTP_PORT")
        or inferred_port
        or "587"
    )
    if smtp_host and not raw_smtp_smarthost:
        raw_smtp_smarthost = f"{smtp_host}:{smtp_port}"
    elif not raw_smtp_smarthost and raw_smtp_host:
        raw_smtp_smarthost = f"{raw_smtp_host}:{smtp_port}"

    env = {
        "POSTGRES_DB": postgres_db,
        "POSTGRES_USER": postgres_user,
        "POSTGRES_PASSWORD": postgres_password,
        "DATABASE_URL": f"postgres://{postgres_user}:{postgres_password}@db:5432/{postgres_db}",
        "SESSION_SECRET": session_secret,
        "MFA_ENABLED": os.environ.get("MFA_ENABLED") or existing.get("MFA_ENABLED") or "true",
        "DOCUMENT_HOLD_MINUTES": os.environ.get("DOCUMENT_HOLD_MINUTES")
        or existing.get("DOCUMENT_HOLD_MINUTES")
        or "30",
        "PAYMENT_DEADLINE_HOURS": os.environ.get("PAYMENT_DEADLINE_HOURS")
        or existing.get("PAYMENT_DEADLINE_HOURS")
        or "24",
        "SMTP_SMARTHOST": raw_smtp_smarthost,
        "SMTP_HOST": smtp_host or raw_smtp_host,
        "SMTP_PORT": smtp_port,
        "SMTP_USER": os.environ.get("SMTP_USER")
        or existing.get("SMTP_USER")
        or "",
        "SMTP_PASS": os.environ.get("SMTP_PASS")
        or existing.get("SMTP_PASS")
        or "",
    }

    remote.write_text(env_path, render_env_file(env))
    return env


def detect_compose_command(remote: RemoteHost) -> str:
    if remote.run("docker compose version", check=False).exit_status == 0:
        return "docker compose"
    if remote.run("docker-compose version", check=False).exit_status == 0:
        return "docker-compose"
    raise RuntimeError("Docker Compose is not available on the remote host")


def upload_source(remote: RemoteHost, archive_path: Path, app_dir: str) -> None:
    remote.ensure_dir(app_dir)
    remote.upload_file(archive_path, "/tmp/loca-auto-deploy.tar.gz")
    remote.run(
        "\n".join(
            [
                f"find {shlex.quote(app_dir)} -mindepth 1 -maxdepth 1 ! -name '.env' -exec rm -rf {{}} +",
                f"tar -xzf /tmp/loca-auto-deploy.tar.gz -C {shlex.quote(app_dir)}",
                "rm -f /tmp/loca-auto-deploy.tar.gz",
            ],
        ),
    )


def wait_for_backend_health(
    remote: RemoteHost,
    app_dir: str,
    compose_cmd: str,
    timeout_seconds: int = 180,
) -> None:
    attempts = max(1, timeout_seconds // 2)
    remote.run(
        "\n".join(
            [
                f"cd {shlex.quote(app_dir)}",
                "container_id=\"\"",
                f"for _ in $(seq 1 {attempts}); do",
                f"  container_id=$({compose_cmd} ps -q backend || true)",
                "  if [ -n \"$container_id\" ]; then",
                "    health=$(docker inspect -f '{{.State.Health.Status}}' \"$container_id\" 2>/dev/null || true)",
                "    if [ \"$health\" = \"healthy\" ]; then",
                "      exit 0",
                "    fi",
                "  fi",
                "  sleep 2",
                "done",
                "echo \"Backend never became healthy\"",
                "exit 1",
            ],
        ),
    )


def mark_seed_completed(remote: RemoteHost, state_dir: str) -> None:
    remote.write_text(f"{state_dir}/{SEED_MARKER}", "ok\n")


def seed_completed(remote: RemoteHost, state_dir: str) -> bool:
    return remote.exists(f"{state_dir}/{SEED_MARKER}")


def run_compose(remote: RemoteHost, app_dir: str, compose_cmd: str, command: str) -> None:
    remote.run(
        f"cd {shlex.quote(app_dir)} && {compose_cmd} {command}",
        get_pty=False,
    )


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    if not args.host:
        raise SystemExit("DEPLOY_HOST is required")
    if not args.password:
        raise SystemExit("DEPLOY_PASSWORD is required")

    archive_path = create_source_archive(REPO_ROOT)

    try:
        with RemoteHost(
            SSHConfig(
                host=args.host,
                username=args.user,
                password=args.password,
                port=args.port,
            ),
        ) as remote:
            bootstrap_server(
                remote,
                domain=args.domain,
                app_dir=args.app_dir,
                state_dir=args.state_dir,
            )

            compose_cmd = detect_compose_command(remote)
            upload_source(remote, archive_path, args.app_dir)
            generate_env(remote, args.app_dir)

            run_compose(
                remote,
                args.app_dir,
                compose_cmd,
                "run --rm --build db-migrate",
            )

            if not seed_completed(remote, args.state_dir):
                run_compose(
                    remote,
                    args.app_dir,
                    compose_cmd,
                    "--profile seed run --rm --build seed",
                )
                mark_seed_completed(remote, args.state_dir)

            run_compose(
                remote,
                args.app_dir,
                compose_cmd,
                "up -d --build --force-recreate backend frontend",
            )

            wait_for_backend_health(remote, args.app_dir, compose_cmd)

            run_compose(
                remote,
                args.app_dir,
                compose_cmd,
                "exec -T backend pnpm --filter @workspace/scripts run init-super-admin",
            )

        print(f"Deployment complete for {args.domain}")
    finally:
        archive_path.unlink(missing_ok=True)


if __name__ == "__main__":
    main()

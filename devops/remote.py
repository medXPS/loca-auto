from __future__ import annotations

from dataclasses import dataclass
import json
import shlex
from pathlib import Path

import paramiko


@dataclass(slots=True)
class SSHConfig:
    host: str
    username: str
    password: str
    port: int = 22
    timeout: int = 30


@dataclass(slots=True)
class CommandResult:
    command: str
    exit_status: int
    stdout: str
    stderr: str


class RemoteHost:
    def __init__(self, config: SSHConfig):
        self.config = config
        self.client = paramiko.SSHClient()
        self.client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    def __enter__(self) -> "RemoteHost":
        self.connect()
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        self.close()

    def connect(self) -> None:
        self.client.connect(
            hostname=self.config.host,
            port=self.config.port,
            username=self.config.username,
            password=self.config.password,
            timeout=self.config.timeout,
        )

    def close(self) -> None:
        self.client.close()

    def run(
        self,
        command: str,
        *,
        check: bool = True,
        cwd: str | None = None,
        env: dict[str, str] | None = None,
        get_pty: bool = False,
    ) -> CommandResult:
        parts: list[str] = []

        if cwd:
            parts.append(f"cd {shlex.quote(cwd)}")

        if env:
            exports = " ".join(
                f"export {key}={shlex.quote(value)};" for key, value in env.items()
            )
            parts.append(exports.rstrip(";"))

        parts.append(command)
        shell_command = " && ".join(parts) if len(parts) > 1 else parts[0]

        stdin, stdout, stderr = self.client.exec_command(
            f"bash -lc {shlex.quote(shell_command)}",
            get_pty=get_pty,
        )
        exit_status = stdout.channel.recv_exit_status()
        stdout_text = stdout.read().decode(errors="replace")
        stderr_text = stderr.read().decode(errors="replace")

        if check and exit_status != 0:
            raise RuntimeError(
                "\n".join(
                    [
                        f"Remote command failed with exit code {exit_status}",
                        f"Command: {command}",
                        stdout_text.strip(),
                        stderr_text.strip(),
                    ]
                ).strip(),
            )

        return CommandResult(
            command=command,
            exit_status=exit_status,
            stdout=stdout_text,
            stderr=stderr_text,
        )

    def ensure_dir(self, remote_path: str) -> None:
        self.run(f"mkdir -p {shlex.quote(remote_path)}")

    def exists(self, remote_path: str) -> bool:
        result = self.run(
            f"test -e {shlex.quote(remote_path)}",
            check=False,
        )
        return result.exit_status == 0

    def read_text(self, remote_path: str) -> str:
        sftp = self.client.open_sftp()
        try:
            with sftp.file(remote_path, "r") as handle:
                return handle.read().decode(errors="replace")
        finally:
            sftp.close()

    def write_text(self, remote_path: str, contents: str) -> None:
        parent = str(Path(remote_path).parent)
        self.ensure_dir(parent)

        sftp = self.client.open_sftp()
        try:
            with sftp.file(remote_path, "w") as handle:
                handle.write(contents)
        finally:
            sftp.close()

    def upload_file(self, local_path: Path, remote_path: str) -> None:
        parent = str(Path(remote_path).parent)
        self.ensure_dir(parent)

        sftp = self.client.open_sftp()
        try:
            sftp.put(str(local_path), remote_path)
        finally:
            sftp.close()


def render_env_file(values: dict[str, str]) -> str:
    ordered_keys = [
        "POSTGRES_DB",
        "POSTGRES_USER",
        "POSTGRES_PASSWORD",
        "DATABASE_URL",
        "SESSION_SECRET",
        "MFA_ENABLED",
        "DOCUMENT_HOLD_MINUTES",
        "PAYMENT_DEADLINE_HOURS",
        "SMTP_SMARTHOST",
        "SMTP_HOST",
        "SMTP_PORT",
        "SMTP_USER",
        "SMTP_PASS",
    ]

    def quote(value: str) -> str:
        if value == "":
            return '""'

        if all(char.isalnum() or char in "._/-:@+" for char in value):
            return value

        return json.dumps(value)

    lines = [
        f"{key}={quote(values[key])}"
        for key in ordered_keys
        if key in values
    ]
    return "\n".join(lines) + "\n"

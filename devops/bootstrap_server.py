from __future__ import annotations

import argparse
import os
import shlex
from textwrap import dedent

from remote import RemoteHost, SSHConfig

DEFAULT_LETSENCRYPT_EMAIL = "admin@demo.com"
DEFAULT_DOWNLOAD_DIR = "/var/www/loca-auto-downloads"


def env_or_default(name: str, default: str | None = None) -> str | None:
    value = os.environ.get(name)
    return value if value not in {None, ""} else default


def render_http_nginx_config(
    domain: str,
    upstream_port: int = 3000,
    *,
    download_dir: str = DEFAULT_DOWNLOAD_DIR,
) -> str:
    return dedent(
        f"""
        server {{
          listen 80;
          listen [::]:80;
          server_name {domain};

          client_max_body_size 50m;

          location ^~ /downloads/ {{
            alias {download_dir}/;
            autoindex on;
            add_header Cache-Control "no-store";
          }}

          location / {{
            proxy_pass http://127.0.0.1:{upstream_port};
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Forwarded-Host $host;
            proxy_set_header X-Forwarded-Port $server_port;
          }}
        }}
        """
    ).strip() + "\n"


def render_https_nginx_config(
    domain: str,
    upstream_port: int = 3000,
    *,
    download_dir: str = DEFAULT_DOWNLOAD_DIR,
) -> str:
    cert_path = f"/etc/letsencrypt/live/{domain}"
    return dedent(
        f"""
        server {{
          listen 80;
          listen [::]:80;
          server_name {domain};
          return 301 https://$host$request_uri;
        }}

        server {{
          listen 443 ssl http2;
          listen [::]:443 ssl http2;
          server_name {domain};

          ssl_certificate {cert_path}/fullchain.pem;
          ssl_certificate_key {cert_path}/privkey.pem;
          ssl_protocols TLSv1.2 TLSv1.3;
          ssl_prefer_server_ciphers on;
          ssl_session_cache shared:SSL:10m;
          ssl_session_timeout 10m;
          add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

          client_max_body_size 50m;

          location ^~ /downloads/ {{
            alias {download_dir}/;
            autoindex on;
            add_header Cache-Control "no-store";
          }}

          location / {{
            proxy_pass http://127.0.0.1:{upstream_port};
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Forwarded-Host $host;
            proxy_set_header X-Forwarded-Port $server_port;
          }}
        }}
        """
    ).strip() + "\n"


def cert_path_exists(remote: RemoteHost, domain: str) -> bool:
    return remote.exists(f"/etc/letsencrypt/live/{domain}/fullchain.pem")


def ensure_certificate(remote: RemoteHost, domain: str, email: str) -> None:
    if cert_path_exists(remote, domain):
        return

    remote.run(
        " ".join(
            [
                "certbot",
                "certonly",
                "--nginx",
                "-d",
                shlex.quote(domain),
                "--non-interactive",
                "--agree-tos",
                "--email",
                shlex.quote(email),
                "--keep-until-expiring",
            ],
        ),
        get_pty=True,
    )


def bootstrap_server(
    remote: RemoteHost,
    *,
    domain: str,
    app_dir: str,
    state_dir: str,
    download_dir: str = DEFAULT_DOWNLOAD_DIR,
    letsencrypt_email: str = DEFAULT_LETSENCRYPT_EMAIL,
) -> None:
    remote.ensure_dir(app_dir)
    remote.ensure_dir(state_dir)
    remote.ensure_dir(download_dir)

    remote.run("apt-get update")
    remote.run(
        "DEBIAN_FRONTEND=noninteractive apt-get install -y "
        "ca-certificates curl git gnupg lsb-release nginx docker.io docker-compose "
        "certbot python3-certbot-nginx",
    )
    remote.run("systemctl enable --now docker")
    remote.run("systemctl enable --now nginx")

    nginx_config_path = f"/etc/nginx/sites-available/{domain}.conf"
    remote.write_text(nginx_config_path, render_http_nginx_config(domain, download_dir=download_dir))
    remote.run("rm -f /etc/nginx/sites-enabled/default")
    remote.run(
        f"ln -sf {nginx_config_path} /etc/nginx/sites-enabled/{domain}.conf",
    )
    remote.run("nginx -t")
    remote.run("systemctl reload nginx")

    ensure_certificate(remote, domain, letsencrypt_email)
    remote.write_text(
        nginx_config_path,
        render_https_nginx_config(domain, download_dir=download_dir),
    )
    remote.run("nginx -t")
    remote.run("systemctl reload nginx")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Prepare the remote server for deployment.")
    parser.add_argument("--host", default=env_or_default("DEPLOY_HOST"))
    parser.add_argument("--user", default=env_or_default("DEPLOY_USER", "root"))
    parser.add_argument("--password", default=env_or_default("DEPLOY_PASSWORD"))
    parser.add_argument("--port", type=int, default=int(env_or_default("DEPLOY_PORT", "22")))
    parser.add_argument(
        "--domain",
        default=env_or_default("DEPLOY_DOMAIN", "demo-locationauto.shonenx.shop"),
    )
    parser.add_argument(
        "--app-dir",
        default=env_or_default("DEPLOY_PATH", "/opt/loca-auto"),
    )
    parser.add_argument(
        "--state-dir",
        default=env_or_default("DEPLOY_STATE_DIR", "/opt/loca-auto-state"),
    )
    parser.add_argument(
        "--download-dir",
        default=env_or_default("DEPLOY_DOWNLOAD_DIR", DEFAULT_DOWNLOAD_DIR),
    )
    parser.add_argument(
        "--letsencrypt-email",
        default=env_or_default("LETSENCRYPT_EMAIL", DEFAULT_LETSENCRYPT_EMAIL),
    )
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    if not args.host:
        raise SystemExit("DEPLOY_HOST is required")
    if not args.password:
        raise SystemExit("DEPLOY_PASSWORD is required")

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
            download_dir=args.download_dir,
            letsencrypt_email=args.letsencrypt_email,
        )

    print(f"Server bootstrap complete for {args.domain}")


if __name__ == "__main__":
    main()

import subprocess
import json
from pathlib import Path
from datetime import datetime, timezone

try:
    import tomli as toml_parser
except ImportError:
    print("Error: 'tomli' not found. Please run 'pip install tomli'")
    toml_parser = None


def get_git_hash() -> str:
    try:
        return subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            text=True,
        ).stdout.strip()
    except subprocess.SubprocessError:
        print("Warning: Unable to get git hash. Using 'unknown'.")
        return "unknown"


def get_build_time() -> int:
    return int(datetime.now(timezone.utc).timestamp() * 1000)


def get_api_port(root: Path) -> int:
    default_port = 8000
    toml_path = root / "romi.toml"

    if not toml_parser:
        return default_port

    if not toml_path.exists():
        print(f"Warning: {toml_path} not found. Using default API port {default_port}.")
        return default_port

    try:
        with open(toml_path, "rb") as f:
            port = toml_parser.load(f).get("port")

            if isinstance(port, int) and 1024 < port < 65535:
                print(f"Success: Read API port {port} from {toml_path}.")
                return port

            print(
                f"Warning: Port field not found or invalid in {toml_path}. Using default {default_port}."
            )
            return default_port

    except Exception as e:
        print(f"Error reading {toml_path}: {e}. Using default API port {default_port}.")
        return default_port


def write_meta_file(path: Path, data: dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        f"export default {json.dumps(data, indent=2)} as const;\n",
        encoding="utf-8",
    )
    print(f"Generated build meta {path} ->", json.dumps(data))


def write_proxy_conf(path: Path, target_url: str) -> None:
    path.write_text(
        json.dumps(
            {
                "/api": {
                    "target": target_url,
                    "secure": False,
                    "changeOrigin": True,
                    "logLevel": "info",
                }
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"Generated proxy config {path} -> Target: {target_url}")


def main() -> None:
    root = Path(__file__).resolve().parents[1]

    write_meta_file(
        root / "client" / "environments" / "build-meta.ts",
        {
            "HASH": get_git_hash(),
            "BUILD_TIME": get_build_time(),
        },
    )
    write_proxy_conf(root / "proxy.conf.json", f"http://localhost:{get_api_port(root)}")


if __name__ == "__main__":
    main()

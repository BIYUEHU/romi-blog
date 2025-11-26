from socket import socket, AF_INET, SOCK_DGRAM
import subprocess
import json
from pathlib import Path
from datetime import datetime, timezone


def get_lan_ip() -> str:
    try:
        with socket(AF_INET, SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except:
        print("Unable to get LAN IP")
        return "127.0.0.1"


def get_git_hash() -> str:
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            text=True,
        )
        return result.stdout.strip()
    except subprocess.SubprocessError:
        raise Exception("Unable to get git hash")


def get_build_time() -> int:
    return int(datetime.now(timezone.utc).timestamp() * 1000)


def write_meta_file(path: Path, data: dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        (
            "// THIS FILE IS AUTO-GENERATED. DO NOT EDIT.\n"
            f"export default {json.dumps(data, indent=2)} as const;\n"
        ),
        encoding="utf-8",
    )
    print(f"Generated build meta {path} ->", json.dumps(data))


def main() -> None:
    root = Path(__file__).resolve().parents[1]

    write_meta_file(
        root / "client" / "environments" / "build-meta.ts",
        {
            "HASH": get_git_hash(),
            "BUILD_TIME": get_build_time(),
            "LAN_IP": get_lan_ip(),
        },
    )


if __name__ == "__main__":
    main()

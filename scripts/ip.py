from socket import socket, AF_INET, SOCK_DGRAM
from os import path


def get_lan_ip() -> str:
    try:
        with socket(AF_INET, SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except:
        print("Unable to get LAN IP")
        return "127.0.0.1"


with open(
    path.join(path.dirname(__file__), "..", "client", "environments", "ip.ts"),
    "w",
) as f:
    f.write(f'export default "{ get_lan_ip()}"\n')

#!/usr/bin/env python3

import subprocess
import sys
from pathlib import Path

commands: list[str] = [
  "bun unocss:dev",
  'cargo watch -c -w src -x "test export_bindings" -x run',
  "bun start",
]

procs: list[tuple[str, subprocess.Popen]] = []
cwd: Path = Path.cwd()

for command in commands:
  try:
    proc = subprocess.Popen(command, cwd=str(cwd), shell=True)
    procs.append((command, proc))
  except Exception as err:
    print(f"Failed to start {command}:", err, file=sys.stderr)

try:
  for command, proc in procs:
    proc.wait()
except KeyboardInterrupt:
  print("\nShutting down...")
  for command, proc in procs:
    proc.terminate()
    try:
      proc.wait(timeout=2)
    except subprocess.TimeoutExpired:
      proc.kill()
  sys.exit(0)
except Exception as err:
  print(f"Error: {err}", file=sys.stderr)
  sys.exit(1)

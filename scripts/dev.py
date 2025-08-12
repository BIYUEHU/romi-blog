#!/usr/bin/env python3

# import { spawn } from 'node:child_process'
# ;['pnpm unocss:dev', 'cargo watch -c -w src -x "test export_bindings" -x run', 'pnpm start'].map((command) => {
#   const [cmd, ...args] = command.split(' ')
#   const proc = spawn(cmd, args, {
#     cwd: process.cwd(),
#     stdio: 'inherit',
#     shell: true
#   })

#   proc.on('error', (err) => {
#     console.error(`Failed to start ${command}:`, err)
#   })
# })

import subprocess
import sys
from pathlib import Path

commands: list[str] = [
    "pnpm unocss:dev",
    'cargo watch -c -w src -x "test export_bindings" -x run',
    "pnpm start",
]

procs: list[tuple[str, subprocess.Popen]] = []
cwd: Path = Path.cwd()

for command in commands:
    try:
        proc = subprocess.Popen(command, cwd=str(cwd), shell=True)
        procs.append((command, proc))
    except Exception as err:
        print(f"Failed to start {command}:", err, file=sys.stderr)

for command, proc in procs:
    try:
        proc.wait()
    except Exception as err:
        print(f"Failed to start {command}:", err, file=sys.stderr)

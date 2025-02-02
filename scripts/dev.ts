import { spawn } from 'node:child_process'
;['pnpm unocss:dev', 'cargo watch -c -w src -x "test export_bindings" -x run', 'pnpm start'].map((command) => {
  const [cmd, ...args] = command.split(' ')
  const proc = spawn(cmd, args, {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: true
  })

  proc.on('error', (err) => {
    console.error(`Failed to start ${command}:`, err)
  })
})

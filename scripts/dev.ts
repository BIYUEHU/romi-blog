import { log } from 'node:console'
import { resolve } from 'node:path'
import sh from 'shelljs'
import chokidar from 'chokidar'
import type { ChildProcess } from 'node:child_process'

log('Starting Bedrock Dedicated Server...')
;['pnpm start', 'pnpm unocss:dev'].map((command) => sh.exec(command, { cwd: resolve('client') }, () => {}))

function runCargo() {
  return sh.exec('cargo run', { cwd: resolve('server') }, () => {})
}

function listener(path: string) {
  if (/\.rs$/.test(path)) {
    log(`File ${path} changed, restarting server...`)
    cargoProcess?.kill()
    cargoProcess = runCargo()
  }
}

let cargoProcess: ChildProcess = runCargo()

chokidar
  .watch('./server', {
    persistent: true,
    ignored: /node_modules|\.git/,
    ignoreInitial: true
  })
  .on('add', listener)
  .on('change', listener)
  .on('unlink', listener)

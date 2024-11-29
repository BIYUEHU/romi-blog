import { readFileSync } from 'node:fs'
import knex from 'knex'
import { join } from 'node:path'

export const dbTo = knex({
  client: 'mysql2',
  connection: JSON.parse(readFileSync(join(__dirname, 'config.json'), 'utf-8')).to
})

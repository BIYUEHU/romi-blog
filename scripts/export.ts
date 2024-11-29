import { writeFileSync } from 'node:fs'
import { TypechoContent, db, getMergedContents, getPostMetas } from './common'
import { join } from 'node:path'

async function main() {
  console.log('Exporting data...')
  const timer = Date.now()
  writeFileSync(
    join(__dirname, 'export.jsonl'),
    (await getMergedContents()).map((json) => JSON.stringify(json)).join('\n')
  )
  await db.destroy()
  console.log('Export completed.')
  console.log(`Time elapsed: ${Date.now() - timer}ms`)
}

main()

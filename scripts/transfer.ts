import { ExtraData, TypechoContent, db, getPostMetas } from './common'
import * as fs from 'node:fs'
import * as path from 'node:path'
import dayjs from 'dayjs'

async function createMarkdownFile(content: TypechoContent, metas: ExtraData) {
  const frontMatter = {
    title: content.title,
    created: dayjs.unix(content.created).format('YYYY-MM-DD HH:mm:ss'),
    modified: dayjs.unix(content.modified).format('YYYY-MM-DD HH:mm:ss'),
    type: content.type,
    status: content.status,
    tags: metas.tags,
    categories: metas.categories
  }

  const markdown = `---
title: ${frontMatter.title}
created: ${frontMatter.created}
modified: ${frontMatter.modified}
type: ${frontMatter.type}
status: ${frontMatter.status}
tags: ${JSON.stringify(frontMatter.tags)}
categories: ${JSON.stringify(frontMatter.categories)}
---

${content.text.replace('<!--markdown-->', '')}`

  const outputDir = path.join(process.cwd(), 'articles')
  fs.mkdirSync(outputDir, { recursive: true })
  const filePath = path.join(outputDir, `${content.cid}.md`)
  fs.writeFileSync(filePath, markdown)
  console.log(`Exported: ${filePath}`)
}

async function main() {
  try {
    const contents: TypechoContent[] = await db('typecho_contents').select('*')

    for (const content of contents) {
      getPostMetas(content.cid).then((metas) => createMarkdownFile(content, metas))
    }

    console.log('Export completed successfully!')
  } catch (error) {
    console.error('Export failed:', error)
  } finally {
    await db.destroy()
  }
}

main()

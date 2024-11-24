import { knex, Knex } from 'knex'
import * as fs from 'node:fs'
import * as path from 'node:path'
import dayjs from 'dayjs'

interface TypechoContent {
  cid: number
  title: string
  created: number
  modified: number
  text: string
  type: string
  status: string
}

interface TypechoMeta {
  mid: number
  name: string
  slug: string
  type: string
  cid: number
}

interface TypechoRelationship {
  cid: number
  mid: number
}

// 建立数据库连接
const db = knex({
  client: 'mysql2',
  connection: JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8'))
})

async function getPostMetas(cid: number): Promise<{ tags: string[]; categories: string[] }> {
  // 获取文章关联的所有 meta
  const relationships = await db('typecho_relationships').where('cid', cid).select('mid')

  const mids = relationships.map((r) => r.mid)

  const metas = await db('typecho_metas').whereIn('mid', mids).select('*')

  const tags = metas.filter((meta) => meta.type === 'tag').map((meta) => meta.name)

  const categories = metas.filter((meta) => meta.type === 'category').map((meta) => meta.name)

  return { tags, categories }
}

async function createMarkdownFile(content: TypechoContent, metas: { tags: string[]; categories: string[] }) {
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
    // 获取所有文章内容
    const contents: TypechoContent[] = await db('typecho_contents').select('*')

    for (const content of contents) {
      const metas = await getPostMetas(content.cid)
      await createMarkdownFile(content, metas)
    }

    console.log('Export completed successfully!')
  } catch (error) {
    console.error('Export failed:', error)
  } finally {
    await db.destroy()
  }
}

main()

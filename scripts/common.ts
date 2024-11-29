import { readFileSync } from 'node:fs'
import knex from 'knex'
import { join } from 'node:path'

export interface TypechoContent {
  cid: number
  title: string
  created: number
  modified: number
  text: string
  type: string
  status: string
  password: boolean
  allowComment: boolean
  commentsNum: number
  viewsNum: number
  views: number
  wordNum: number
  likes: number
}

export interface ExtraData {
  tags: string[]
  categories: string[]
  banner?: string
}

export const db = knex({
  client: 'mysql2',
  connection: JSON.parse(readFileSync(join(__dirname, 'config.json'), 'utf-8')).from
})

export async function getPostMetas(cid: number): Promise<ExtraData> {
  const metas = await db('typecho_metas')
    .whereIn(
      'mid',
      (await db('typecho_relationships').where('cid', cid).select('mid')).map((r) => r.mid)
    )
    .select('*')

  return {
    tags: metas.filter((meta) => meta.type === 'tag').map((meta) => meta.name),
    categories: metas.filter((meta) => meta.type === 'category').map((meta) => meta.name),
    banner: (await db('typecho_fields').where('cid', cid).where('name', 'banner').select('str_value').first())
      ?.str_value
  }
}

export async function getMergedContents() {
  return (
    await Promise.all(
      ((await db('typecho_contents').select('*')) as TypechoContent[]).map(async (content) => {
        const data = { ...content, ...(await getPostMetas(content.cid)) }
        return data
      })
    )
  ).sort((a, b) => a.created - b.created)
}

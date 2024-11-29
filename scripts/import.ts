import { getMergedContents, db } from './common'
import { dbTo } from './common_to'

async function main() {
  console.log('importing posts to db')
  const time = Date.now()
  const contents = (await getMergedContents()).filter(
    ({ type, title }) => ['post', 'page'].includes(type) && title !== '归档'
  )
  const tagsRecord: Record<string, number[]> = {}
  const categoriesRecord: Record<string, number[]> = {}

  for (const [key, content] of Object.entries(contents)) {
    const pid = Number(key) + 1
    for (const tag of content.tags) {
      if (tag in tagsRecord) {
        tagsRecord[tag].push(pid)
      } else {
        tagsRecord[tag] = [pid]
      }
    }

    for (const category of content.categories) {
      if (category in categoriesRecord) {
        categoriesRecord[category].push(pid)
      } else {
        categoriesRecord[category] = [pid]
      }
    }

    dbTo('romi_posts')
      .insert({
        pid,
        title: content.title,
        created: content.created,
        modified: content.modified,
        text: content.text.replace('<!--markdown-->', ''),
        password: content.password ? '1' : '0',
        hide: content.type === 'page' || content.status !== 'publish' ? '1' : '0',
        allowComment: content.allowComment ? '1' : '0',
        views: content.views,
        likes: content.likes,
        comments: content.commentsNum,
        banner: content.banner
      })
      .then(() => {
        if (pid !== contents.length) return
        Promise.all(
          [tagsRecord, categoriesRecord].map((obj, index) =>
            Promise.all(
              Object.entries(obj).map(([name, pids]) =>
                dbTo('romi_metas')
                  .insert({ name, count: pids.length, isCategory: index.toString() })
                  .then(([mid]) => Promise.all(pids.map((pid) => dbTo('romi_relationships').insert({ pid, mid }))))
              )
            )
          )
        ).then(() => {
          console.log(`imported ${contents.length} posts in ${Date.now() - time}ms`)
          dbTo.destroy()
          db.destroy()
        })
      })
  }
}

main()

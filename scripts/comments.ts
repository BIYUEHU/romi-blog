import { db } from './common'
import { dbTo } from './common_to'

async function main() {
  const arr = await db('typecho_comments').select('*')
  for (const [key, value] of Object.entries(arr)) {
    const cid = Number(key) + 1
    dbTo('romi_comments')
      .insert({
        cid: value.coid,
        pid: value.cid,
        uid: Number(!value.authorId),
        created: value.created,
        ip: value.ip,
        ua: value.agent,
        text: value.text
      })
      .then(() => {
        if (cid === arr.length) {
          db.destroy()
          dbTo.destroy()
          console.log(`Transfer ${arr.length} comments successfully.`)
        }
      })
  }
}

main()

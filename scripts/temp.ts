import { writeFileSync } from 'node:fs'
import list1 from './bilbili_raw1.json'
import list2 from './bilbili_raw2.json'

const bilibili_raw = list1.data.list.vlist.concat(list2.data.list.vlist)

writeFileSync(
  './bilibili.json',
  JSON.stringify(
    bilibili_raw.map(({ comment, play, pic, description, title, author, created, aid, bvid, length }) => ({
      comment,
      play,
      pic,
      description,
      title,
      author,
      created,
      aid,
      bvid,
      length
    })),
    null,
    2
  )
)

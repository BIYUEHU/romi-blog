import { AuthUser } from '../../output'

export * from '../../output'

// export interface Author {
//   username: string
//   avatar: string
// }

export type UserAuthData = AuthUser & { token: string }

export interface BangumiData {
  data: {
    subject_id: number
    tags: string[]
    subject: {
      name: string
      images: {
        medium: string
      }
      short_summary: string
      eps?: number
      date: string
    }
  }[]
  total: number
}

export interface Video {
  comment: number
  play: number
  pic: string
  description: string
  title: string
  author: string
  created: number
  aid: number
  bvid: string
  length: string
}

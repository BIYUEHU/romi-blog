import { AuthUser } from './api.model'

export * from '../../output'

export interface Author {
  username: string
  avatar: string
}

export interface RelatedPost {
  url: string
  title: string
  type: 'prev' | 'next'
}

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

export interface Character {
  id: number
  name: string
  romaji: string
  gender: 'MALE' | 'FEMALE'
  alias: string[]
  age: number | null
  images: string[]
  url: string[]
  description: string
  comment: string
  hitokoto: string
  voice: string
  series: string
  seriesGenre: string
  tags: string[]
  hairColor: string
  eyeColor: string
  bloodType?: string
  height?: number
  bust?: number
  waist?: number
  hip?: number
  weight?: number
  createdAt: string
  color: string
  hide: boolean
  order: number
  songId: number
}

export interface Repository {
  id: number
  name: string
  description: string | null
  html_url: string
  homepage: string | null
  language: string | null
  stargazers_count: number
  forks_count: number
  topics: string[]
  created_at: string
  updated_at: string
  license: { name: string } | null
  archived: boolean
  visibility: string
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

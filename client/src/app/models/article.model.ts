export interface Article {
  aid: number
  title: string
  created: number
  modified: number
  text: string
  password: string | null
  hide: string
  allowComment: string
  views: number
  likes: number
  comments: number
}

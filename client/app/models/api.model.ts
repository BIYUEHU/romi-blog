export interface ReqPostData {
  title: string
  text: string
  password: boolean
  hide: boolean
  allow_comment: boolean
  created: number
  modified: number
  tags: string[]
  categories: string[]
}

export interface ResPostData {
  id: number
  title: string
  summary: string
  created: number
  banner?: string
}

export interface ResPostSingleData {
  id: number
  title: string
  created: number
  modified: number
  text: string
  password: boolean
  allow_comment: boolean
  tags: string[]
  categories: string[]
  views: number
  likes: number
  comments: number
  banner: string
}

// TODO: improve backend api and here is temporary solution
export interface ResPostSingleDataExtra {
  url: string
  commentsList: { created: number; author: Author; id: number; reply: number; text: string }[]
}

export interface Author {
  username: string
  avatar: string
}

export interface ExternalHitokoto {
  data: {
    msg: string
    from: string
    id: number
  }
}

export interface RelatedPost {
  url: string
  title: string
  type: 'prev' | 'next'
}

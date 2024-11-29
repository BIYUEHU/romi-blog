export interface Post {
  id: string
  title: string
  content: string
  date: Date
  summary: string
  cover?: string
}

export interface Author {
  name: string
  avatar: string
  bio: string
}

export interface ExternalHitokoto {
  data: {
    msg: string
    from: string
    id: number
  }
}

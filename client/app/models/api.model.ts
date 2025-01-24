export * from '../../output'

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

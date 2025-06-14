import { Observable } from 'rxjs'
import { ResCharacterData, ResNewsData, ResPostData } from '../models/api.model'

export function handlePostList(posts: ResPostData[]) {
  return posts.map((post) => (post.password === 'password' ? { ...post, summary: '文章已加密' } : post))
}

export function formatDate(date: Date) {
  const addZero = (num: number) => (num < 10 ? `0${num}` : num)
  return `${date.getFullYear()}-${addZero(date.getMonth() + 1)}-${addZero(date.getDate())}T${addZero(date.getHours())}:${addZero(date.getMinutes())}`
}

export function sortByCreatedTime<T extends ResPostData[] | ResNewsData[]>(posts: T): T {
  return posts.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()) as T
}

export function observableToPromise<T>(observable: Observable<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    observable.subscribe({
      next: (value) => resolve(value),
      error: (error) => reject(error)
    })
  })
}

export function renderCharacterBWH({ bust, waist, hip }: ResCharacterData) {
  return `${bust ? `B${bust}` : ''}${waist ? `${bust ? '/' : ''}W${waist}` : ''}${hip ? `${bust || waist ? '/' : ''}H${hip}` : ''}`
}

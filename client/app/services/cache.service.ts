import { Injectable } from '@angular/core'
import { ApiService } from './api.service'
import { RelatedPost, ResPostData } from '../models/api.model'
import { Observable, of, map, tap } from 'rxjs'
import { CommentData, generateCommentsList } from '../utils/generateCommentsList'

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private readonly CACHE_KEY = 'posts-list'
  private readonly CACHE_DURATION = 1000 * 60 * 60 // 1小时缓存

  constructor(private readonly apiService: ApiService) {}

  public getRelatedPosts(currentId: number): Observable<RelatedPost[]> {
    return this.getPostsData().pipe(
      map((posts) => {
        const currentIndex = posts.findIndex((post) => post.id === currentId)
        if (currentIndex === -1) return []

        const relatedPosts: RelatedPost[] = []

        if (currentIndex > 0) {
          relatedPosts.push({
            url: `/post/${posts[currentIndex - 1].id}`,
            title: posts[currentIndex - 1].title,
            type: 'prev'
          })
        }

        if (currentIndex < posts.length - 1) {
          relatedPosts.push({
            url: `/post/${posts[currentIndex + 1].id}`,
            title: posts[currentIndex + 1].title,
            type: 'next'
          })
        }

        return relatedPosts
      })
    )
  }

  private getPostsData(): Observable<ResPostData[]> {
    const cachedData = this.getCachedData()

    if (cachedData) {
      return of(cachedData)
    }

    return this.apiService.getPosts().pipe(tap((posts) => this.setCacheData(posts)))
  }

  private getCachedData(): ResPostData[] | null {
    return []
    /*  const cached = localStorage.getItem(this.CACHE_KEY)
    if (!cached) return null

    try {
      const { data, timestamp } = JSON.parse(cached)

      // 检查缓存是否过期
      if (Date.now() - timestamp > this.CACHE_DURATION) {
        // localStorage.removeItem(this.CACHE_KEY)
        return null
      }

      return data
    } catch {
      return null
    }*/
  }

  public setCacheData(data: ResPostData[]): void {
    const cacheData = {
      data,
      timestamp: Date.now()
    }
    // localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData))
  }

  public getCommentsList(id: number): CommentData[] {
    return []
    /*
    const cached = localStorage.getItem(`comments-${id}`)
    if (cached) {
      return JSON.parse(cached)
    }
    const data = generateCommentsList()
    // localStorage.setItem(`comments-${id}`, JSON.stringify(data))
    return data*/
  }
}

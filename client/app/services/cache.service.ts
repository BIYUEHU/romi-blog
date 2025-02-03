import { Injectable } from '@angular/core'
import { ApiService } from './api.service'
import { RelatedPost, ResPostData } from '../models/api.model'
import { Observable, of, map, tap } from 'rxjs'
import { CommentData, generateCommentsList } from '../utils/generateCommentsList'
import { BrowserService } from './browser.service'

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private readonly CACHE_KEY = 'posts-list'
  private readonly CACHE_DURATION = 1000 * 60 * 60 // 1小时缓存

  public constructor(
    private readonly apiService: ApiService,
    private readonly browserService: BrowserService
  ) {}

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
    const storage = this.browserService.localStorage
    if (!storage) return []
    const cached = storage.getItem(this.CACHE_KEY)
    if (!cached) return null

    try {
      const { data, timestamp } = JSON.parse(cached)

      if (Date.now() - timestamp > this.CACHE_DURATION) {
        storage.removeItem(this.CACHE_KEY)
        return null
      }

      return data
    } catch {
      return null
    }
  }

  public setCacheData(data: ResPostData[]): void {
    const storage = this.browserService.localStorage
    if (!storage) return
    const cacheData = {
      data,
      timestamp: Date.now()
    }
    storage.setItem(this.CACHE_KEY, JSON.stringify(cacheData))
  }

  public getCommentsList(id: number): CommentData[] {
    const storage = this.browserService.localStorage
    if (!storage) return []
    const cached = storage.getItem(`comments-${id}`)
    if (cached) {
      return JSON.parse(cached)
    }
    const data = generateCommentsList()
    storage.setItem(`comments-${id}`, JSON.stringify(data))
    return data
  }
}

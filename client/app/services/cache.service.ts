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

  public getRelatedPosts(currentId: number): Observable<[RelatedPost?, RelatedPost?]> {
    return this.getPostsData().pipe(
      map((posts) => {
        const currentIndex = posts.findIndex((post) => post.id === currentId)
        return currentIndex === -1
          ? []
          : [
              currentIndex > 0
                ? {
                    url: `/post/${posts[currentIndex - 1].id}`,
                    title: posts[currentIndex - 1].title,
                    type: 'prev'
                  }
                : undefined,
              currentIndex < posts.length - 1
                ? {
                    url: `/post/${posts[currentIndex + 1].id}`,
                    title: posts[currentIndex + 1].title,
                    type: 'next'
                  }
                : undefined
            ]
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

  public getCachedData(): ResPostData[] | null {
    const { localStorage } = this.browserService
    if (!localStorage) return []
    const cached = localStorage.getItem(this.CACHE_KEY)
    if (!cached) return null

    try {
      const { data, timestamp } = JSON.parse(cached)

      if (Date.now() - timestamp > this.CACHE_DURATION) {
        localStorage.removeItem(this.CACHE_KEY)
        return null
      }

      return data
    } catch {
      return null
    }
  }

  public setCacheData(data: ResPostData[]): void {
    const { localStorage } = this.browserService
    if (!localStorage) return
    const cacheData = {
      data,
      timestamp: Date.now()
    }
    localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData))
  }

  public getCommentsList(id: number): CommentData[] {
    const { localStorage } = this.browserService
    if (!localStorage) return []
    const cached = localStorage.getItem(`comments-${id}`)
    if (cached) {
      return JSON.parse(cached)
    }
    const data = generateCommentsList()
    localStorage.setItem(`comments-${id}`, JSON.stringify(data))
    return data
  }
}

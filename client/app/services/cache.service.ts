import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'

interface CacheEntry<T> {
  data: T
  timestamp: number
}

@Injectable({
  providedIn: 'root'
})
class CacheService {
  private SHORT_TTL = 30 * 1000 // 30秒
  private LONG_TTL = 3600 * 1000 // 1小时

  get<T>(key: string): Observable<T> {
    const cached = this.getFromStorage<T>(key)
    const now = Date.now()

    if (!cached) {
      // 无缓存，直接请求
      return this.fetchAndCache(key)
    }

    const age = now - cached.timestamp

    if (age < this.SHORT_TTL) {
      // 短期内，直接返回缓存
      return of(cached.data)
    } else if (age < this.LONG_TTL) {
      // 长期内，返回缓存 + 后台更新
      this.fetchAndCache(key).subscribe() // 静默更新
      return of(cached.data)
    } else {
      // 过期，删除并重新请求
      this.removeFromStorage(key)
      return this.fetchAndCache(key)
    }
  }
}

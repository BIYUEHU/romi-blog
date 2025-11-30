import { Injectable } from '@angular/core'
import { iso, Newtype } from 'newtype-ts'
import { BrowserService } from './browser.service'

interface StoreKey extends Newtype<{ readonly StoreKey: unique symbol }, string> {}

const isoStoreKey = iso<StoreKey>()

export const STORE_KEYS = {
  APLAYER_DISABLED: isoStoreKey.wrap('aplayer-disabled'),
  APLAYER_ALIVE_TIME: isoStoreKey.wrap('aplayer-alive-time'),
  ADMIN_AUTH: isoStoreKey.wrap('admin-auth'),
  POST_DRAFT_NEW: isoStoreKey.wrap('post-draft-new'),
  IS_DEBUG: isoStoreKey.wrap('is-dev-mode'),
  postLiked: (id: number) => isoStoreKey.wrap(`post-liked-${id}`),
  postViewed: (id: number) => isoStoreKey.wrap(`post-viewed-${id}`),
  postDraft: (id: number) => isoStoreKey.wrap(`post-draft-${id}`),
  postDraftTime: (id: number) => isoStoreKey.wrap(`post-draft-${id}-time`),
  hitokotoLiked: (id: number) => isoStoreKey.wrap(`hitokoto-liked-${id}`),
  newsLiked: (id: number) => isoStoreKey.wrap(`news-liked-${id}`),
  newsViewed: (id: number) => isoStoreKey.wrap(`news-viewed-${id}`),
  cache: (key: string) => isoStoreKey.wrap(`cache-${key}`)
} as const

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private getStorage(persist: boolean) {
    return persist ? localStorage : sessionStorage
  }

  private getKey(key: StoreKey) {
    return `romi-${isoStoreKey.unwrap(key)}`
  }

  public constructor(private readonly browserService: BrowserService) {}

  public setItem(key: StoreKey, value: string | number | boolean, persist = true) {
    if (this.browserService.is) this.getStorage(persist).setItem(this.getKey(key), String(value))
  }

  public getItem(key: StoreKey, persist = true): string | null {
    return this.browserService.is ? this.getStorage(persist).getItem(this.getKey(key)) : null
  }

  public removeItem(key: StoreKey, persist = true) {
    if (this.browserService.is) this.getStorage(persist).removeItem(this.getKey(key))
  }
}

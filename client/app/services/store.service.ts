import { Injectable } from '@angular/core'

enum SymbolKeys {
  APLAYER_DISABLED = 'aplayer-disabled',
  APLAYER_ALIVE_TIME = 'aplayer-alive-time',
  ADMIN_AUTH = 'admin-auth',
  HITOKOTO_LIKED = 'hitokoto-liked-$',
  POST_LIKED = 'post-liked-$',
  POST_VIEWED = 'post-viewed-$',
  POST_DRAFT_NEW = 'post-draft-new',
  POST_DRAFT = 'post-draft-$',
  POST_DRAFT_TIME = 'post-draft-$-time',
  NEWS_LIKED = 'news-liked-$',
  NEWS_VIEWED = 'news-viewed-$'
}

export const KEYS = {
  APLAYER_DISABLED: SymbolKeys.APLAYER_DISABLED,
  APLAYER_ALIVE_TIME: SymbolKeys.APLAYER_ALIVE_TIME,
  ADMIN_AUTH: SymbolKeys.ADMIN_AUTH,
  HITOKOTO_LIKED: (id: number) => KEYS.replace(SymbolKeys.HITOKOTO_LIKED, id),
  POST_LIKED: (id: number) => KEYS.replace(SymbolKeys.POST_LIKED, id),
  POST_VIEWED: (id: number) => KEYS.replace(SymbolKeys.POST_VIEWED, id),
  POST_DRAFT_NEW: SymbolKeys.POST_DRAFT_NEW,
  POST_DRAFT: (id: number) => KEYS.replace(SymbolKeys.POST_DRAFT, id),
  POST_DRAFT_TIME: (id: number) => KEYS.replace(SymbolKeys.POST_DRAFT_TIME, id),
  NEWS_LIKED: (id: number) => KEYS.replace(SymbolKeys.NEWS_LIKED, id),
  NEWS_VIEWED: (id: number) => KEYS.replace(SymbolKeys.NEWS_VIEWED, id),
  replace: (key: SymbolKeys, value: string | number | boolean) => key.replaceAll('$', String(value)) as SymbolKeys
}

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  public getStorage(persist: boolean) {
    return persist ? localStorage : sessionStorage
  }

  public getKey(key: SymbolKeys) {
    return `romi-${key}`
  }

  public setItem(key: SymbolKeys, value: string | number | boolean, persist = true) {
    this.getStorage(persist).setItem(this.getKey(key), String(value))
  }

  public getItem(key: SymbolKeys, persist = true): string | null {
    return this.getStorage(persist).getItem(this.getKey(key))
  }

  public removeItem(key: SymbolKeys, persist = true) {
    this.getStorage(persist).removeItem(this.getKey(key))
  }
}

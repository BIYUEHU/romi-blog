import { makeStateKey, TransferState, type OnInit, inject } from '@angular/core'
import { ApiService } from '../services/api.service'
import { BrowserService } from '../services/browser.service'

export function romiComponentFactory<T = unknown>(key: string) {
  abstract class RomiComponent {
    private readonly CACHE_KEY = makeStateKey<T>(key)

    protected readonly apiService = inject(ApiService)

    protected readonly browserService = inject(BrowserService)

    private readonly transferState = inject(TransferState)

    public data?: T

    protected setData(setter: (set: (data: T) => void) => void, handler?: (data: T) => void) {
      if (this.transferState.hasKey(this.CACHE_KEY)) {
        this.data = this.transferState.get(this.CACHE_KEY, null) as T
        this.transferState.remove(this.CACHE_KEY)
        handler?.(this.data)
      } else {
        setter((data) => {
          this.data = data
          if (!this.browserService.isBrowser) this.transferState.set(this.CACHE_KEY, data)
          handler?.(data)
        })
      }
    }
  }
  return RomiComponent
}

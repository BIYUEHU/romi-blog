import { inject, makeStateKey, TransferState } from '@angular/core'
import { Observable, of, tap } from 'rxjs'
import { ApiService } from '../services/api.service'
import { BrowserService } from '../services/browser.service'

export function romiComponentFactory<T = unknown>(key: string) {
  abstract class RomiComponent {
    private readonly CACHE_KEY = makeStateKey<T>(key)

    protected readonly apiService = inject(ApiService)

    protected readonly browserService = inject(BrowserService)

    private readonly transferState = inject(TransferState)

    public data?: T

    protected loadData(source$: Observable<T>): Observable<T> {
      if (this.transferState.hasKey(this.CACHE_KEY)) {
        const cached = this.transferState.get(this.CACHE_KEY, null) as T

        if (this.browserService.isBrowser) {
          setTimeout(() => {
            this.transferState.remove(this.CACHE_KEY)
          }, 0)
        }

        return of(cached)
      }

      return source$.pipe(
        tap((data) => {
          if (!this.browserService.isBrowser) {
            this.transferState.set(this.CACHE_KEY, data)
          }
        })
      )
    }
  }

  return RomiComponent
}

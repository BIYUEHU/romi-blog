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

    protected load2Data(source$: Observable<T>): Observable<T> {
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

    // TODO: new method with automatic set
    protected load(source$: Observable<T>, callback?: (data: T) => void) {
      if (this.transferState.hasKey(this.CACHE_KEY)) {
        this.data = this.transferState.get(this.CACHE_KEY, null) as T
        callback?.(this.data)

        if (this.browserService.isBrowser) {
          setTimeout(() => {
            this.transferState.remove(this.CACHE_KEY)
          }, 0)
        }
      } else {
        source$
          .pipe(
            tap((data) => {
              if (!this.browserService.isBrowser) {
                this.transferState.set(this.CACHE_KEY, data)
              }
            })
          )
          .subscribe((data) => {
            this.data = data
            callback?.(data)
          })
      }
    }
  }

  return RomiComponent
}

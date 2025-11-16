import { HttpInterceptorFn } from '@angular/common/http'
import { inject, makeStateKey, TransferState } from '@angular/core'
import { Observable, tap } from 'rxjs'
import { BrowserService } from '../services/browser.service'

export const transferInterceptor: HttpInterceptorFn = (req, next) => {
  const transfer = inject(TransferState)
  const browser = inject(BrowserService)

  if (req.method !== 'GET') return next(req)

  // biome-ignore lint: *
  const KEY = makeStateKey<any>(`http-${req.urlWithParams}`)

  if (browser.isBrowser && transfer.hasKey(KEY)) {
    const cached = transfer.get(KEY, null)
    transfer.remove(KEY)
    if (cached) {
      return new Observable((observer) => {
        observer.next(cached)
        observer.complete()
      })
    }
  }

  return next(req).pipe(
    tap((data) => {
      if (!browser.isBrowser) transfer.set(KEY, data)
    })
  )
}

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

  return (
    browser.on(() => {
      if (!transfer.hasKey(KEY)) return null
      const cached = transfer.get(KEY, null)
      transfer.remove(KEY)
      if (!cached) return
      return new Observable((observer) => {
        observer.next(JSON.parse(cached))
        observer.complete()
      })
    }) ??
    next(req).pipe(
      tap((data) => {
        if (!browser.is) transfer.set(KEY, data)
      })
    )
  )
}

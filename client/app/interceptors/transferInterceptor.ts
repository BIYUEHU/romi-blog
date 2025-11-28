import { HttpInterceptorFn, HttpResponse } from '@angular/common/http'
import { inject, makeStateKey, TransferState } from '@angular/core'
import { of, tap } from 'rxjs'
import { BrowserService } from '../services/browser.service'

export const transferInterceptor: HttpInterceptorFn = (req, next) => {
  const transfer = inject(TransferState)
  const browser = inject(BrowserService)
  if (req.method !== 'GET' && req.headers.get('Authorization')) return next(req)

  // biome-ignore lint: *
  const KEY = makeStateKey<any>(
    `http-${(() => {
      try {
        const url = new URL(req.urlWithParams)
        return `${url.pathname}${url.search}`
      } catch {
        return req.urlWithParams
      }
    })()}`
  )
  return (
    browser.on(() => {
      if (!transfer.hasKey(KEY)) return null
      const stored = transfer.get(KEY, null)
      transfer.remove(KEY)
      if (!stored) return null
      return of(new HttpResponse(stored))
    }) ??
    next(req).pipe(
      tap((data) => {
        if (!browser.is) transfer.set(KEY, data)
      })
    )
  )
}

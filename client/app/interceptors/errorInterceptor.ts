import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http'
import { inject } from '@angular/core'
import { Router } from '@angular/router'
import { EMPTY, throwError } from 'rxjs'
import { catchError } from 'rxjs/operators'
import { match } from 'ts-pattern'
import { AuthService } from '../services/auth.service'
import { BrowserService } from '../services/browser.service'
import { LoggerService } from '../services/logger.service'
import { NotifyService } from '../services/notify.service'
import { HEADER_CONTEXT } from '../shared/constants'

export const errorInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const browser = inject(BrowserService)
  const logger = inject(LoggerService)
  const auth = inject(AuthService)
  const layout = inject(NotifyService)
  const router = inject(Router)
  let headers = req.headers
  const SkipErrorHandling = req.headers.has(HEADER_CONTEXT.SKIP_ERROR_HANDLING)
  const ErrorRedirect = req.headers.has(HEADER_CONTEXT.ERROR_REDIRECT)
  if (SkipErrorHandling) headers = headers.delete(HEADER_CONTEXT.SKIP_ERROR_HANDLING)
  if (ErrorRedirect) headers = headers.delete(HEADER_CONTEXT.ERROR_REDIRECT)

  return next(req.clone({ headers })).pipe(
    catchError((err) => {
      logger.label('HTTP').error(err)

      if (
        ErrorRedirect &&
        match(err.status)
          .with(403, () => {
            router.navigate(['/403'])
            return true
          })
          .with(404, () => {
            router.navigate(['/404'])
            return true
          })
          .with(500, () => {
            router.navigate(['/500'])
            return true
          })
          .otherwise(() => false)
      ) {
        return EMPTY
      }

      if (browser.is && err.status === 401) {
        if (router.url.startsWith('/admin/') && router.url !== '/admin/login') {
          layout.showMessage('登录已过期，请重新登录', 'error')
          auth.logout()
          return EMPTY
        }
      }

      if (SkipErrorHandling) return throwError(() => err)

      layout.showMessage(`未知错误，请联系管理员 状态码：${err.status}`, 'error')
      return EMPTY

      // if (r.method.toUpperCase() === 'GET') {
      //     match(err.status)
      //         .with(404, () => router.navigate(['/404']))
      //         .otherwise(() => notify.showMessage(`未知错误，请联系管理员 状态码：${err.status}`, 'error'))
      //     return EMPTY
      // }
    })
  )
}

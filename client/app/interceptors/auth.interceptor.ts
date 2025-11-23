import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http'
import { inject } from '@angular/core'
import { catchError, EMPTY, throwError } from 'rxjs'
import { AuthService } from '../services/auth.service'
import { BrowserService } from '../services/browser.service'
import { LayoutService } from '../services/layout.service'
import { LoggerService } from '../services/logger.service'

export const authInterceptor: HttpInterceptorFn = (request: HttpRequest<unknown>, next: HttpHandlerFn) => {
  if (!inject(BrowserService).isBrowser) return next(request)

  const auth = inject(AuthService)
  const notify = inject(LayoutService)

  const skipError = request.headers.has('Skip-Error-Handler')
  const skipToken = request.headers.has('Skip-Bring-Token')

  let headers = request.headers
  if (skipError) headers = headers.delete('Skip-Error-Handler')
  if (skipToken) headers = headers.delete('Skip-Bring-Token')

  const token = skipToken ? null : auth.getToken()

  const cloned = request.clone({
    headers: token ? headers.set('Authorization', `Bearer ${token}`) : headers
  })

  return next(cloned).pipe(
    catchError((err) => {
      inject(LoggerService).label('HTTP').error(err)

      if (token && err.status === 401) {
        if (location.href.includes('/admin/')) {
          notify.showMessage('登录已过期，请重新登录', 'error')
          auth.logout()
        }
        return EMPTY
      }

      if (
        err.status === 404 &&
        ['/news/', '/post/', '/char', '/admin/edit/'].some((url) => request.url.includes(url))
      ) {
        location.href = '/404'
        return EMPTY
      }

      if (skipError) return throwError(() => err)

      if (err.statusText?.trim()) {
        notify.showMessage(`错误：${err.statusText} 状态码：${err.status}`, 'error')
      } else {
        notify.showMessage(`未知错误，请联系管理员 状态码：${err.status}`, 'error')
      }

      return EMPTY
    })
  )
}

import { HttpHandlerFn, HttpRequest } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { catchError, EMPTY, throwError } from 'rxjs'
import { AuthService } from '../services/auth.service'
import { BrowserService } from '../services/browser.service'
import { LoggerService } from '../services/logger.service'
import { NotifyService } from '../services/notify.service'

@Injectable({
  providedIn: 'root'
})
export class AuthInterceptor /* implements HttpInterceptor */ {
  public constructor(
    private readonly authService: AuthService,
    private readonly browserService: BrowserService,
    private readonly notifyService: NotifyService,
    private readonly loggerService: LoggerService
  ) {}

  public intercept(request: HttpRequest<unknown>, next: HttpHandlerFn) {
    if (!this.browserService.isBrowser) return next(request)

    const skipErrorHandler = request.headers.has('Skip-Error-Handler')
    const skipBringToken = request.headers.has('Skip-Bring-Token')
    let headers = skipErrorHandler ? request.headers.delete('Skip-Error-Handler') : request.headers
    headers = skipBringToken ? headers.delete('Skip-Bring-Token') : headers
    const token = skipBringToken ? null : this.authService.getToken()

    return next(
      request.clone({
        headers: token ? headers.set('Authorization', `Bearer ${token}`) : headers
      })
    ).pipe(
      catchError((error) => {
        this.loggerService.label('HTTP').error(error)

        if (token && error.status === 401) {
          if (location.href.includes('/admin/')) {
            this.notifyService.showMessage('登录已过期，请重新登录', 'error')
            this.authService.logout()
          }
          return EMPTY
        }

        if (
          error.status === 404 &&
          ['/news/', '/post/', '/char', '/admin/edit/'].some((url) => request.url.includes(url))
        ) {
          location.href = '/404'
          return EMPTY
        }

        if (skipErrorHandler) return throwError(() => error)

        if (error.statusText.trim()) {
          this.notifyService.showMessage(`错误：${error.statusText} 状态码：${error.status} `, 'error')
        } else {
          this.notifyService.showMessage(`未知错误，请联系管理员 状态码：${error.status} `, 'error')
        }
        return EMPTY
      })
    )
  }
}

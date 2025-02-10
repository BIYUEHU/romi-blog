import { Injectable } from '@angular/core'
import { HttpRequest, HttpHandlerFn } from '@angular/common/http'
import { EMPTY, catchError, throwError } from 'rxjs'
import { AuthService } from '../services/auth.service'
import { BrowserService } from '../services/browser.service'
import { NotifyService } from '../services/notify.service'

@Injectable({
  providedIn: 'root'
})
export class AuthInterceptor /* implements HttpInterceptor */ {
  public constructor(
    private readonly authService: AuthService,
    private readonly browserService: BrowserService,
    private readonly notifyService: NotifyService
  ) {}

  public intercept(request: HttpRequest<unknown>, next: HttpHandlerFn) {
    if (!this.browserService.isBrowser) return next(request)

    const skipErrorHandler = request.headers.has('Skip-Error-Handler')
    const headers = skipErrorHandler ? request.headers.delete('Skip-Error-Handler') : request.headers
    const token = this.authService.getToken()

    return next(
      request.clone({
        headers: token ? headers.set('Authorization', `Bearer ${token}`) : headers
      })
    ).pipe(
      catchError((error) => {
        if (token && error.status === 401) {
          this.notifyService.showMessage('登录已过期，请重新登录', 'error')
          this.authService.logout()
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

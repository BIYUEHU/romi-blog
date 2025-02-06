import { Injectable } from '@angular/core'
import { HttpRequest, HttpHandlerFn } from '@angular/common/http'
import { EMPTY, catchError, throwError } from 'rxjs'
import { AuthService } from '../services/auth.service'
import { BrowserService } from '../services/browser.service'

@Injectable({
  providedIn: 'root'
})
export class AuthInterceptor /* implements HttpInterceptor */ {
  public constructor(
    private readonly authService: AuthService,
    private readonly browserService: BrowserService
  ) {}

  public intercept(request: HttpRequest<unknown>, next: HttpHandlerFn) {
    if (!this.browserService.isBrowser) return next(request)
    const token = this.authService.getToken()
    if (!token) return next(request)

    return next(
      request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      })
    ).pipe(
      catchError((error) => {
        if (error.status === 401) {
          this.authService.logout()
          return EMPTY
        }
        return throwError(() => error)
      })
    )
  }
}

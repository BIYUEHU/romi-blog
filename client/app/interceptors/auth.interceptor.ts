import { Injectable } from '@angular/core'
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http'
import { Observable } from 'rxjs'
import { AuthService } from '../services/auth.service'
import { BrowserService } from '../services/browser.service'

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  public constructor(
    private readonly authService: AuthService,
    readonly browserService: BrowserService
  ) {}

  public intercept(request: HttpRequest<object>, next: HttpHandler): Observable<HttpEvent<object>> {
    if (!this.browserService.isBrowser) return next.handle(request)
    const token = this.authService.getToken()
    if (!token) return next.handle(request)

    return next.handle(
      request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      })
    )
  }
}

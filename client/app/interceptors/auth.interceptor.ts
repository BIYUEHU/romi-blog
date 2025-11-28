import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http'
import { inject } from '@angular/core'
import { AuthService } from '../services/auth.service'
import { BrowserService } from '../services/browser.service'
import { HEADER_CONTEXT } from '../shared/constants'

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  if (!inject(BrowserService).is) return next(req)

  let headers = req.headers
  const SkipBringToken = req.headers.has(HEADER_CONTEXT.SKIP_BRING_TOKEN)
  if (SkipBringToken) headers = headers.delete(HEADER_CONTEXT.SKIP_BRING_TOKEN)

  const token = SkipBringToken ? inject(AuthService).getToken() : null

  return next(
    req.clone({
      headers: token ? headers.set('Authorization', `Bearer ${token}`) : headers
    })
  )
}

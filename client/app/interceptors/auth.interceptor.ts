import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http'
import { inject } from '@angular/core'
import { AuthService } from '../services/auth.service'
import { BrowserService } from '../services/browser.service'

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  if (!inject(BrowserService).is) return next(req)

  const auth = inject(AuthService)

  const skipBringToken = req.headers.has('Skip-Bring-Token')
  let headers = req.headers
  if (skipBringToken) headers = headers.delete('Skip-Bring-Token')

  const token = skipBringToken ? null : auth.getToken()

  return next(
    req.clone({
      headers: token ? headers.set('Authorization', `Bearer ${token}`) : headers
    })
  )
}

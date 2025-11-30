import { inject } from '@angular/core'
import { CanActivateFn, Router } from '@angular/router'
import { AuthService } from '../services/auth.service'
import { BrowserService } from '../services/browser.service'

export const authGuard: CanActivateFn = () => {
  const router = inject(Router)
  if (!inject(BrowserService).is) return true
  if (inject(AuthService).isLoggedIn()) return true
  return router.url.includes('/admin/login') ? true : router.createUrlTree(['/admin/login'])
}

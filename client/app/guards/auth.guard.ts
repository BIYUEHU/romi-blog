import { inject } from '@angular/core'
import { CanActivateFn, Router, RouterStateSnapshot } from '@angular/router'
import { AuthService } from '../services/auth.service'
import { BrowserService } from '../services/browser.service'
import { NotifyService } from '../services/notify.service'
import { MessageBoxType } from '../shared/types'

export const authGuard: CanActivateFn = (_, state: RouterStateSnapshot) => {
  if (!inject(BrowserService).is) return true
  const router = inject(Router)
  const auth = inject(AuthService)
  const notify = inject(NotifyService)
  const url = state.url

  if (url.includes('/admin/login')) return true

  const user = auth.user$()
  if (!user) return router.createUrlTree(['/admin/login'])

  if (user.status !== 0) {
    notify.showMessage('账号已被封禁，请联系管理员', MessageBoxType.Error)
    auth.logout()
    return router.createUrlTree(['/admin/login'])
  }

  if (url === '/admin' || url === '/admin/') {
    return router.createUrlTree([user.is_admin ? '/admin/dashboard' : '/admin/profile'])
  }

  if (url.includes('/admin/profile')) return true
  if (user.is_admin) return true

  return router.createUrlTree(['/admin/profile'])
}

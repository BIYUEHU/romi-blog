import { inject } from '@angular/core'
import { CanActivateFn, Router } from '@angular/router'
import { MessageBoxType } from '../components/message/message.component'
import { NotifyService } from '../services/notify.service'
import { STORE_KEYS, StoreService } from '../services/store.service'

export const debugGuard: CanActivateFn = () => {
  const store = inject(StoreService)
  const isDebug = store.getItem(STORE_KEYS.IS_DEBUG) === 'true'
  store.setItem(STORE_KEYS.IS_DEBUG, String(!isDebug))
  inject(NotifyService).showMessage(
    !isDebug ? '已开启调试模式' : '已关闭调试模式',
    !isDebug ? MessageBoxType.Warning : MessageBoxType.Success
  )
  return inject(Router).createUrlTree(['/'])
}

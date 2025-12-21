import { animate, style, transition, trigger } from '@angular/animations'
import { Component, CUSTOM_ELEMENTS_SCHEMA, effect } from '@angular/core'
import { NotifyService } from '../../services/notify.service'

@Component({
  selector: 'app-message',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './message.component.html',
  animations: [
    trigger('slideRight', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [animate('300ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))])
    ])
  ]
})
export class MessageComponent {
  public message = {
    message: '',
    type: 'info' as 'error' | 'info' | 'success' | 'warning' | 'secondary' | 'primary'
  }

  public constructor(notifyService: NotifyService) {
    effect(() => {
      const message = notifyService.messageNotify$()
      if (!message) return
      this.message = message
      const timer = Number(
        setTimeout(() => {
          this.message = { message: '', type: 'info' }
          clearTimeout(timer)
        }, 3000)
      )
    })
  }
}

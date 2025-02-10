import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit } from '@angular/core'
import { NotifyService } from '../../services/notify.service'
import { animate, style, transition, trigger } from '@angular/animations'

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
export class MessageComponent implements OnInit {
  public messageData = {
    message: '',
    type: 'info' as 'error' | 'info' | 'success' | 'warning' | 'secondary' | 'primary'
  }

  public constructor(private readonly notifyService: NotifyService) {}

  public ngOnInit() {
    this.notifyService.messageNotify$.subscribe((messageData) => {
      if (!messageData) return
      this.messageData = messageData
      const timer = Number(
        setTimeout(() => {
          this.messageData = { message: '', type: 'info' }
          clearTimeout(timer)
        }, 3000)
      )
    })
  }
}

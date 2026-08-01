import { animate, style, transition, trigger } from '@angular/animations'
import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, effect } from '@angular/core'
import { NotifyService } from '../../services/notify.service'
import { isoMessageBoxSecond, MessageBoxType } from '../../shared/types'

@Component({
  selector: 'app-message',
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
  private static readonly EMPTY_MESSAGE = {
    message: '',
    type: MessageBoxType.show(MessageBoxType.Info)
  }
  public message = MessageComponent.EMPTY_MESSAGE

  public constructor(notifyService: NotifyService, cdr: ChangeDetectorRef) {
    effect(() => {
      const data = notifyService.messageNotify$()
      if (!data) return
      this.message = { message: data[0], type: MessageBoxType.show(data[1]) }
      const timer = Number(
        setTimeout(() => {
          this.message = MessageComponent.EMPTY_MESSAGE
          clearTimeout(timer)
        }, isoMessageBoxSecond.unwrap(data[2]).value * 1000)
      )
      cdr.detectChanges()
    })
  }
}

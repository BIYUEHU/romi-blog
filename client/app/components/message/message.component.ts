import { animate, style, transition, trigger } from '@angular/animations'
import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, effect } from '@angular/core'
import { iso, Newtype } from 'newtype-ts'
import { NotifyService } from '../../services/notify.service'

export interface MessageBoxType
  extends Newtype<
    { readonly MessageBoxType: unique symbol },
    | { readonly _tag: 'Info' }
    | { readonly _tag: 'Error' }
    | { readonly _tag: 'Success' }
    | { readonly _tag: 'Warning' }
    | { readonly _tag: 'Secondary' }
    | { readonly _tag: 'Primary' }
  > {}

export const isoMessageBoxType = iso<MessageBoxType>()

export const MessageBoxType = {
  Info: isoMessageBoxType.wrap({ _tag: 'Info' }),
  Error: isoMessageBoxType.wrap({ _tag: 'Error' }),
  Success: isoMessageBoxType.wrap({ _tag: 'Success' }),
  Warning: isoMessageBoxType.wrap({ _tag: 'Warning' }),
  Secondary: isoMessageBoxType.wrap({ _tag: 'Secondary' }),
  Primary: isoMessageBoxType.wrap({ _tag: 'Primary' })
}

export interface MessageBoxSecond
  extends Newtype<{ readonly MessageBoxSecond: unique symbol }, { readonly _tag: 'MessageBoxSecond'; value: number }> {}

export const isoMessageBoxSecond = iso<MessageBoxSecond>()

export const MessageBoxSecond = (value: number) => isoMessageBoxSecond.wrap({ _tag: 'MessageBoxSecond', value })

const show = (type: MessageBoxType) => isoMessageBoxType.unwrap(type)._tag.toLowerCase()

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
  private static readonly EMPTY_MESSAGE = {
    message: '',
    type: show(MessageBoxType.Info)
  }
  public message = MessageComponent.EMPTY_MESSAGE

  public constructor(notifyService: NotifyService, cdr: ChangeDetectorRef) {
    effect(() => {
      const data = notifyService.messageNotify$()
      if (!data) return
      this.message = { message: data[0], type: show(data[1]) }
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

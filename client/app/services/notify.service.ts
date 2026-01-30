import { Injectable, signal } from '@angular/core'
import { MessageBoxSecond, MessageBoxType } from '../components/message/message.component'

@Injectable({
  providedIn: 'root'
})
export class NotifyService {
  private readonly messageNotify = signal<[string, MessageBoxType, MessageBoxSecond] | null>(null)

  public readonly messageNotify$ = this.messageNotify.asReadonly()

  public showMessage(message: string, type = MessageBoxType.Info, second = MessageBoxSecond(3)) {
    this.messageNotify.set([message, type, second])
  }
}

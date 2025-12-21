import { Injectable, signal } from '@angular/core'
import { MessageComponent } from '../components/message/message.component'

@Injectable({
  providedIn: 'root'
})
export class NotifyService {
  private readonly messageNotify = signal<MessageComponent['message'] | null>(null)

  public readonly messageNotify$ = this.messageNotify.asReadonly()

  public showMessage(message: string, type: MessageComponent['message']['type'] = 'info') {
    this.messageNotify.set({ message, type })
  }
}

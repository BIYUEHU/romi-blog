import { Injectable, signal } from '@angular/core'
import { MessageComponent } from '../components/message/message.component'

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  public static readonly DEFAULT_HEADER = {
    title: 'Arimura Sena',
    subTitle: ['What is mind? No matter.', 'What is matter? Never mind.'],
    imageUrl: 'api/utils/background'
  }

  private readonly messageNotify = signal<MessageComponent['message'] | null>(null)

  public readonly messageNotify$ = this.messageNotify.asReadonly()

  private readonly header = signal(LayoutService.DEFAULT_HEADER)

  public readonly header$ = this.header.asReadonly()

  public updateHeader(data: Partial<typeof LayoutService.DEFAULT_HEADER>) {
    this.header.update((header) => ({ ...header, ...data }))
  }

  public showMessage(message: string, type: MessageComponent['message']['type'] = 'info') {
    this.messageNotify.set({ message, type })
  }
}

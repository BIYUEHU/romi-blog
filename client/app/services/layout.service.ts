import { effect, Injectable, signal } from '@angular/core'
import { Title } from '@angular/platform-browser'
import { MessageComponent } from '../components/message/message.component'
import { DEFAULT_TITLE } from '../shared/constants'
import { BrowserService } from './browser.service'

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  private static readonly DEFAULT_HEADER = {
    title: 'Arimura Sena',
    subTitle: ['What is mind? No matter.', 'What is matter? Never mind.'],
    imageUrl: 'api/utils/background'
  }

  private readonly messageNotify = signal<MessageComponent['message'] | null>(null)

  public readonly messageNotify$ = this.messageNotify.asReadonly()

  private readonly header = signal(LayoutService.DEFAULT_HEADER)

  public readonly header$ = this.header.asReadonly()

  private readonly isSidebarOpen = signal(false)

  public readonly isSidebarOpen$ = this.isSidebarOpen.asReadonly()

  public constructor(
    private readonly title: Title,
    browserService: BrowserService
  ) {
    browserService.on(() => this.isSidebarOpen.set(window.innerWidth >= 1024))
    effect(() => {
      const isOpen = this.isSidebarOpen()
      browserService.on(() => {
        if (window.innerWidth < 1024) document.body.style.overflow = isOpen ? 'hidden' : ''
      })
    })
  }

  public updateHeader(data: Partial<typeof LayoutService.DEFAULT_HEADER>) {
    this.header.update((header) => ({ ...header, ...data }))
  }

  public showMessage(message: string, type: MessageComponent['message']['type'] = 'info') {
    this.messageNotify.set({ message, type })
  }

  public toggleSidebar() {
    this.isSidebarOpen.update((isOpen) => !isOpen)
  }

  public closeSidebar() {
    this.isSidebarOpen.set(false)
  }

  public setTitle(title?: string) {
    this.title.setTitle(title?.trim() ? `${title.slice(0, 30)} - ${DEFAULT_TITLE}` : DEFAULT_TITLE)
  }
}

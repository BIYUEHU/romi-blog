import { Injectable } from '@angular/core'
import { Title } from '@angular/platform-browser'
import { BehaviorSubject, Subject } from 'rxjs'
import { LayoutUsingComponent } from '../components/layout-using/layout-using.component'
import { MessageComponent } from '../components/message/message.component'
import { DEFAULT_TITLE } from '../shared/constants'
import { BrowserService } from './browser.service'

@Injectable({
  providedIn: 'root'
})
export class NotifyService {
  private headerUpdated = new Subject<Partial<LayoutUsingComponent['headerData']>>()

  public headerUpdated$ = this.headerUpdated.asObservable()

  private messageNotify = new BehaviorSubject<MessageComponent['messageData'] | null>(null)

  public messageNotify$ = this.messageNotify.asObservable()

  private isSidebarOpen

  public isSidebarOpen$

  public constructor(
    private readonly browserService: BrowserService,
    private readonly title: Title
  ) {
    this.isSidebarOpen = new BehaviorSubject((this.browserService.windowRef?.innerWidth ?? 0) >= 1024)
    this.isSidebarOpen$ = this.isSidebarOpen.asObservable()
    this.isSidebarOpen.subscribe((isOpen) => {
      if (this.browserService.isBrowser && window.innerWidth < 1024) {
        document.body.style.overflow = isOpen ? 'hidden' : ''
      }
    })
  }

  public updateHeaderContent(data: Partial<LayoutUsingComponent['headerData']>) {
    Promise.resolve().then(() => {
      this.headerUpdated.next(data)
    })
  }

  public showMessage(message: string, type: MessageComponent['messageData']['type'] = 'info') {
    this.messageNotify.next({ message, type })
  }

  public toggleSidebar() {
    this.isSidebarOpen.next(!this.isSidebarOpen.value)
  }

  public closeSidebar() {
    this.isSidebarOpen.next(false)
  }

  public setTitle(title?: string) {
    this.title.setTitle(title?.trim() ? `${title.slice(0, 30)} - ${DEFAULT_TITLE}` : DEFAULT_TITLE)
  }
}

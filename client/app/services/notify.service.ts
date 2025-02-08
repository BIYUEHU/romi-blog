import { Injectable } from '@angular/core'
import { BehaviorSubject, Subject } from 'rxjs'
import { LayoutComponent } from '../components/layout/layout.component'
import { BrowserService } from './browser.service'

@Injectable({
  providedIn: 'root'
})
export class NotifyService {
  private headerUpdated = new Subject<Partial<LayoutComponent['headerData']>>()

  public headerUpdated$ = this.headerUpdated.asObservable()

  private isSidebarOpen

  public isSidebarOpen$

  public constructor(private readonly browserService: BrowserService) {
    this.isSidebarOpen = new BehaviorSubject((this.browserService.windowRef?.innerWidth ?? 0) >= 1024)
    this.isSidebarOpen$ = this.isSidebarOpen.asObservable()
    this.isSidebarOpen.subscribe((isOpen) => {
      if (this.browserService.isBrowser && window.innerWidth < 1024)
        document.body.style.overflow = isOpen ? 'hidden' : ''
    })
  }

  public updateHeaderContent(data: Partial<LayoutComponent['headerData']>) {
    Promise.resolve().then(() => {
      this.headerUpdated.next(data)
    })
  }

  public toggleSidebar() {
    this.isSidebarOpen.next(!this.isSidebarOpen.value)
  }

  public closeSidebar() {
    this.isSidebarOpen.next(false)
  }
}

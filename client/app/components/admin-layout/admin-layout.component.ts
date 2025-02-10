import { Component, HostListener } from '@angular/core'
import { AsyncPipe } from '@angular/common'
import { RouterOutlet } from '@angular/router'
import { AdminHeaderComponent } from '../admin-header/admin-header.component'
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component'
import { AdminFooterComponent } from '../admin-footer/admin-footer.component'
import { BrowserService } from '../../services/browser.service'
import { NotifyService } from '../../services/notify.service'

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [AsyncPipe, RouterOutlet, AdminHeaderComponent, AdminSidebarComponent, AdminFooterComponent],
  templateUrl: './admin-layout.component.html'
})
export class AdminLayoutComponent {
  public isView = false
  public isSidebarOpen$

  public constructor(
    private readonly browserService: BrowserService,
    private readonly notifyService: NotifyService
  ) {
    this.isView = this.browserService.isBrowser
    this.isSidebarOpen$ = this.notifyService.isSidebarOpen$
  }

  @HostListener('window:resize')
  public onResize() {
    if (window.innerWidth < 1024) this.notifyService.closeSidebar()
  }
}

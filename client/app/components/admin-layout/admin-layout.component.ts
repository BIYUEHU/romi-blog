import { Component, HostListener } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { BrowserService } from '../../services/browser.service'
import { LayoutService } from '../../services/layout.service'
import { AdminFooterComponent } from '../admin-footer/admin-footer.component'
import { AdminHeaderComponent } from '../admin-header/admin-header.component'
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component'

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, AdminHeaderComponent, AdminSidebarComponent, AdminFooterComponent],
  templateUrl: './admin-layout.component.html'
})
export class AdminLayoutComponent {
  public isView = false
  public isSidebarOpen$

  public constructor(
    private readonly browserService: BrowserService,
    private readonly layoutService: LayoutService
  ) {
    this.isView = this.browserService.isBrowser
    this.isSidebarOpen$ = this.layoutService.isSidebarOpen$
  }

  @HostListener('window:resize')
  public onResize() {
    if (window.innerWidth < 1024) this.layoutService.closeSidebar()
  }
}

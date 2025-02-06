import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Router, RouterOutlet } from '@angular/router'
import { AdminHeaderComponent } from '../admin-header/admin-header.component'
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component'
import { AdminFooterComponent } from '../admin-footer/admin-footer.component'
import { UserAuthData } from '../../models/api.model'
import { AuthService } from '../../services/auth.service'
import { BrowserService } from '../../services/browser.service'

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, AdminHeaderComponent, AdminSidebarComponent, AdminFooterComponent],
  templateUrl: './admin-layout.component.html'
})
export class AdminLayoutComponent {
  public isView = false

  public constructor(private readonly browserService: BrowserService) {
    this.isView = this.browserService.isBrowser
  }
}

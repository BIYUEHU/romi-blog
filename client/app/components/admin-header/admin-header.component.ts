import { DatePipe, NgOptimizedImage } from '@angular/common'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { UserAuthData } from '../../models/api.model'
import { AuthService } from '../../services/auth.service'
import { LayoutService } from '../../services/layout.service'

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [RouterLink, DatePipe, NgOptimizedImage],
  templateUrl: './admin-header.component.html'
})
export class AdminHeaderComponent {
  public user?: UserAuthData

  public createDate = new Date()

  public isSidebarOpen$

  public readonly avatarUrl = '/api/utils/qqavatar' // TODO: github avatar

  public constructor(
    private readonly authService: AuthService,
    private readonly layoutService: LayoutService
  ) {
    this.createDate = new Date((this.user?.created ?? 0) * 1000)
    this.isSidebarOpen$ = this.layoutService.isSidebarOpen$
  }

  public toggleSidebar() {
    this.layoutService.toggleSidebar()
  }

  public logout() {
    this.authService.logout()
  }
}

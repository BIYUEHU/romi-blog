import { DatePipe } from '@angular/common'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { UserAuthData } from '../../models/api.model'
import { AuthService } from '../../services/auth.service'
import { NotifyService } from '../../services/notify.service'
import { API_BASE_URL } from '../../shared/constants'

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './admin-header.component.html'
})
export class AdminHeaderComponent {
  public user?: UserAuthData

  public createDate = new Date()

  public isSidebarOpen$

  public avatarUrl = `${API_BASE_URL}/utils/qqavatar` // TODO: github avatar

  public constructor(
    private readonly authService: AuthService,
    private readonly notifyService: NotifyService
  ) {
    this.authService.user$.subscribe((user) => {
      if (user) this.user = user
    })
    this.createDate = new Date((this.user?.created ?? 0) * 1000)
    this.isSidebarOpen$ = this.notifyService.isSidebarOpen$
  }

  public toggleSidebar() {
    this.notifyService.toggleSidebar()
  }

  public logout() {
    this.authService.logout()
  }
}

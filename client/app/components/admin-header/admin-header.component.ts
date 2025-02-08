import { DatePipe } from '@angular/common'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { AuthService } from '../../services/auth.service'
import { UserAuthData } from '../../models/api.model'
import { NotifyService } from '../../services/notify.service'

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './admin-header.component.html'
})
export class AdminHeaderComponent {
  public user: UserAuthData | null = null

  public createDate = new Date()

  public isSidebarOpen$

  public constructor(
    private readonly authService: AuthService,
    private readonly notifyService: NotifyService
  ) {
    this.authService.user$.subscribe((user) => {
      this.user = user
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

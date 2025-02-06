import { DatePipe } from '@angular/common'
import { Component } from '@angular/core'
import { Router, RouterLink } from '@angular/router'
import { AuthService } from '../../services/auth.service'
import { UserAuthData } from '../../models/api.model'

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './admin-header.component.html'
})
export class AdminHeaderComponent {
  public user: UserAuthData | null = null

  public createDate = new Date()

  public constructor(private readonly authService: AuthService) {
    this.authService.user$.subscribe((user) => {
      this.user = user
    })
    this.createDate = new Date((this.user?.created ?? 0) * 1000)
  }

  public toggleSidebar() {
    // 实现侧边栏切换逻辑
  }

  public logout() {
    this.authService.logout()
  }
}

import { DatePipe } from '@angular/common'
import { Component, computed, Input, WritableSignal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { ApiService } from '../../services/api.service'
import { AuthService } from '../../services/auth.service'

@Component({
  selector: 'app-admin-header',
  imports: [RouterLink, DatePipe],
  templateUrl: './admin-header.component.html'
})
export class AdminHeaderComponent {
  @Input({ required: true }) public isSidebarOpen!: WritableSignal<boolean>

  public readonly createDate

  public constructor(
    public readonly authService: AuthService,
    public readonly apiService: ApiService
  ) {
    this.createDate = computed(() => new Date((this.authService.user$()?.created ?? 0) * 1000))
  }

  public get avatarUrl(): string {
    return this.authService.user$()?.is_admin
      ? (this.apiService.settings().homeAvatar ?? '/assets/avatar.jpg')
      : '/assets/avatar.jpg'
  }

  public logout() {
    this.authService.logout()
  }

  public toggleSidebar() {
    this.isSidebarOpen.update((isOpen) => !isOpen)
  }
}

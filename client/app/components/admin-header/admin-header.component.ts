import { DatePipe, NgOptimizedImage } from '@angular/common'
import { Component, computed, Input, WritableSignal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { AuthService } from '../../services/auth.service'

@Component({
  selector: 'app-admin-header',
  imports: [RouterLink, DatePipe, NgOptimizedImage],
  templateUrl: './admin-header.component.html'
})
export class AdminHeaderComponent {
  @Input({ required: true }) public isSidebarOpen!: WritableSignal<boolean>

  public readonly createDate

  public readonly avatarUrl = '/api/utils/qqavatar' // TODO: github avatar
  public constructor(public readonly authService: AuthService) {
    this.createDate = computed(() => new Date((this.authService.user$()?.created ?? 0) * 1000))
  }

  public logout() {
    this.authService.logout()
  }

  public toggleSidebar() {
    this.isSidebarOpen.update((isOpen) => !isOpen)
  }
}

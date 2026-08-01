import { DatePipe } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'
import { ApiService } from '../../services/api.service'
import { AuthService } from '../../services/auth.service'
import { NotifyService } from '../../services/notify.service'
import { MessageBoxType } from '../../shared/types'
import { isPasswordStrong } from '../../shared/utils'

@Component({
  selector: 'app-admin-profile',
  imports: [FormsModule, WebComponentInputAccessorDirective, DatePipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './admin-profile.component.html'
})
export class AdminProfileComponent implements OnInit {
  public isLoading = true
  public user: { username: string; email: string; url: string | null; created: number } | null = null
  public username = ''
  public url = ''
  public oldPassword = ''
  public newPassword = ''
  public confirmPassword = ''

  public constructor(
    private readonly authService: AuthService,
    private readonly apiService: ApiService,
    private readonly notifyService: NotifyService,
    private readonly router: Router
  ) {}

  public ngOnInit(): void {
    const currentUser = this.authService.user$()
    if (!currentUser) {
      this.notifyService.showMessage('请先登录', MessageBoxType.Error)
      this.router.navigate(['/admin/login'])
      return
    }
    this.user = {
      username: currentUser.username,
      email: currentUser.email ?? '',
      url: currentUser.url ?? '',
      created: currentUser.created
    }
    this.username = currentUser.username
    this.url = currentUser.url ?? ''
    this.isLoading = false
  }

  public saveProfile(): void {
    if (!this.oldPassword) {
      this.notifyService.showMessage('请输入旧密码', MessageBoxType.Warning)
      return
    }
    const hasUsernameChange = this.username !== this.user?.username
    const hasUrlChange = this.url !== (this.user?.url ?? '')
    const hasPasswordChange = !!this.newPassword

    if (!hasUsernameChange && !hasUrlChange && !hasPasswordChange) {
      this.notifyService.showMessage('没有检测到任何修改', MessageBoxType.Warning)
      return
    }
    if (hasPasswordChange) {
      if (this.newPassword.length < 6) {
        this.notifyService.showMessage('新密码至少6位', MessageBoxType.Warning)
        return
      }
      if (this.newPassword !== this.confirmPassword) {
        this.notifyService.showMessage('两次输入密码不一致', MessageBoxType.Warning)
        return
      }
      if (!isPasswordStrong(this.newPassword)) {
        this.notifyService.showMessage('密码强度不足，请使用更复杂的密码', MessageBoxType.Warning)
        return
      }
    }
    const finalNewPassword = hasPasswordChange ? this.newPassword : null
    const finalUsername = hasUsernameChange ? this.username : null
    const finalUrl = hasUrlChange ? this.url : null
    this.apiService
      .updateProfile(finalUsername?.trim() ?? null, finalUrl, this.oldPassword, finalNewPassword)
      .subscribe({
        next: () => {
          const msg = hasPasswordChange ? '个人资料更新成功，请重新登录' : '个人资料更新成功'
          this.notifyService.showMessage(msg, MessageBoxType.Success)
          if (hasPasswordChange) {
            this.authService.logout()
          } else {
            const currentUser = this.authService.user$()
            if (currentUser) {
              const updatedUser = { ...currentUser, username: this.username, url: this.url }
              this.authService.setUser(updatedUser, true)
            }
            this.user!.username = this.username
            this.user!.url = this.url
            this.oldPassword = ''
            this.newPassword = ''
            this.confirmPassword = ''
          }
        },
        error: (err) => {
          if (err.status === 400) {
            this.notifyService.showMessage('旧密码错误', MessageBoxType.Error)
          } else {
            this.notifyService.showMessage('更新失败', MessageBoxType.Error)
          }
        }
      })
  }

  public goBack(): void {
    this.router.navigate(['/admin'])
  }
}

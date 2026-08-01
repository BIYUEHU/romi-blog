import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Router, RouterLink } from '@angular/router'
import { WebComponentCheckboxAccessorDirective } from '../../directives/web-component-checkbox-accessor.directive'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'
import { ApiService } from '../../services/api.service'
import { AuthService } from '../../services/auth.service'
import { LoggerService } from '../../services/logger.service'
import { NotifyService } from '../../services/notify.service'
import { MessageBoxType } from '../../shared/types'
import { showErr } from '../../shared/utils'

@Component({
  selector: 'app-admin-login',
  imports: [FormsModule, WebComponentInputAccessorDirective, WebComponentCheckboxAccessorDirective, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './admin-login.component.html'
})
export class AdminLoginComponent {
  public email = ''
  public password = ''
  public rememberMe = false
  public isLoading = false

  public constructor(
    private readonly router: Router,
    private readonly apiService: ApiService,
    private readonly loggerService: LoggerService,
    private readonly notifyService: NotifyService,
    private readonly authService: AuthService
  ) {
    if (this.authService.isLoggedIn()) this.router.navigate(['/admin/dashboard']).then()
  }
  public async handleSubmit() {
    if (!this.email || !this.password) {
      this.notifyService.showMessage('请输入邮箱和密码', MessageBoxType.Warning)
      return
    }

    this.isLoading = true
    this.apiService.login(this.email, this.password).subscribe({
      error: (data) => {
        this.loggerService.error('Login error', data)
        this.notifyService.showMessage(`登录失败，意外的错误：${showErr(data)}`, MessageBoxType.Error)
      },
      next: (data) => {
        this.isLoading = false
        if (data) {
          this.notifyService.showMessage(`欢迎回来，了不起的 ${data.username} 先生`, MessageBoxType.Success)
          this.authService.setUser(data, this.rememberMe)
          this.router.navigate(['/admin/dashboard'])
        } else {
          this.notifyService.showMessage('邮箱或密码错误', MessageBoxType.Error)
        }
      }
    })
  }

  public forgotPassword() {
    alert('你他妈密码忘了我能咋办？')
  }
}

import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { WebComponentCheckboxAccessorDirective } from '../../directives/web-component-checkbox-accessor.directive'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'
import { ApiService } from '../../services/api.service'
import { AuthService } from '../../services/auth.service'
import { BrowserService } from '../../services/browser.service'
import { NotifyService } from '../../services/notify.service'

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [FormsModule, WebComponentInputAccessorDirective, WebComponentCheckboxAccessorDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './admin-login.component.html'
})
export class AdminLoginComponent {
  public username = ''
  public password = ''
  public rememberMe = false
  public isLoading = false

  public constructor(
    private readonly router: Router,
    private readonly apiService: ApiService,
    private readonly authService: AuthService,
    private readonly browserService: BrowserService,
    private readonly notifyService: NotifyService
  ) {
    if (this.browserService.isBrowser && this.authService.isLoggedIn()) location.href = '/admin/dashboard'
    this.notifyService.setTitle('管理员登录')
  }

  public async handleSubmit() {
    if (!this.username || !this.password) {
      this.notifyService.showMessage('请输入用户名和密码', 'warning')
      return
    }

    this.isLoading = true
    this.apiService.login(this.username, this.password).subscribe((data) => {
      this.isLoading = false
      if (data) {
        this.notifyService.showMessage(`欢迎回来，了不起的 ${data.username} 先生`, 'success')
        this.authService.setUser(data, this.rememberMe)
        this.router.navigate(['/admin/dashboard'])
      } else {
        this.notifyService.showMessage('用户名或密码错误', 'error')
      }
    })
  }

  public forgotPassword() {
    alert('你他妈密码忘了我能咋办？')
  }
}

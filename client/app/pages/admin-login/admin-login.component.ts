import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { WebComponentCheckboxAccessorDirective } from '../../directives/web-component-checkbox-accessor.directive'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'
import { ApiService } from '../../services/api.service'
import { AuthService } from '../../services/auth.service'
import { BrowserService } from '../../services/browser.service'
import { LayoutService } from '../../services/layout.service'

@Component({
  selector: 'app-admin-login',
  imports: [FormsModule, WebComponentInputAccessorDirective, WebComponentCheckboxAccessorDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './admin-login.component.html'
})
export class AdminLoginComponent {
  public username = ''
  public password = ''
  public rememberMe = false
  public isLoading = false

  private readonly authService: AuthService = inject(AuthService)

  public constructor(
    private readonly router: Router,
    private readonly apiService: ApiService,
    private readonly layoutService: LayoutService,
    browserService: BrowserService
  ) {
    if (browserService.is && this.authService.isLoggedIn()) {
      this.router.navigate(['/admin/dashboard']).then()
    } else {
      this.layoutService.setTitle('管理员登录')
    }
  }

  public async handleSubmit() {
    if (!this.username || !this.password) {
      this.layoutService.showMessage('请输入用户名和密码', 'warning')
      return
    }

    this.isLoading = true
    this.apiService.login(this.username, this.password).subscribe((data) => {
      this.isLoading = false
      if (data) {
        this.layoutService.showMessage(`欢迎回来，了不起的 ${data.username} 先生`, 'success')
        this.authService.setUser(data, this.rememberMe)
        this.router.navigate(['/admin/dashboard'])
      } else {
        this.layoutService.showMessage('用户名或密码错误', 'error')
      }
    })
  }

  public forgotPassword() {
    alert('你他妈密码忘了我能咋办？')
  }
}

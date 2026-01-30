import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { MessageBoxType } from '../../components/message/message.component'
import { WebComponentCheckboxAccessorDirective } from '../../directives/web-component-checkbox-accessor.directive'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'
import { ApiService } from '../../services/api.service'
import { AuthService } from '../../services/auth.service'
import { NotifyService } from '../../services/notify.service'

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
    private readonly notifyService: NotifyService
  ) {
    if (this.authService.isLoggedIn()) this.router.navigate(['/admin/dashboard']).then()
  }

  public async handleSubmit() {
    if (!this.username || !this.password) {
      this.notifyService.showMessage('请输入用户名和密码', MessageBoxType.Warning)
      return
    }

    this.isLoading = true
    this.apiService.login(this.username, this.password).subscribe({
      error: (data) => console.log('error', data),
      next: (data) => {
        this.isLoading = false
        if (data) {
          this.notifyService.showMessage(`欢迎回来，了不起的 ${data.username} 先生`, MessageBoxType.Success)
          this.authService.setUser(data, this.rememberMe)
          this.router.navigate(['/admin/dashboard'])
        } else {
          this.notifyService.showMessage('用户名或密码错误', MessageBoxType.Error)
        }
      }
    })
  }

  public forgotPassword() {
    alert('你他妈密码忘了我能咋办？')
  }
}

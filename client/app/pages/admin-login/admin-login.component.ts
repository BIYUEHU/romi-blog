import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { ApiService } from '../../services/api.service'
import { AuthService } from '../../services/auth.service'
import { BrowserService } from '../../services/browser.service'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'
import { WebComponentCheckboxAccessorDirective } from '../../directives/web-component-checkbox-accessor.directive'

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, WebComponentInputAccessorDirective, WebComponentCheckboxAccessorDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './admin-login.component.html',
  styles: [
    `
    :host {
      display: block;
      height: 100vh;
    }

    /* Optional: Add animation for alerts */
    r-alert {
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        transform: translateY(-10px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `
  ]
})
export class AdminLoginComponent {
  private errorMessageData = ''
  public username = ''
  public password = ''
  public rememberMe = false
  public isLoading = false
  public isSuccess = false

  public constructor(
    private readonly router: Router,
    private readonly apiService: ApiService,
    private readonly authService: AuthService,
    private readonly browserService: BrowserService
  ) {
    if (this.browserService.isBrowser && this.authService.isLoggedIn()) {
      location.href = '/admin/dashboard'
    }
  }

  public get errorMessage() {
    return this.errorMessageData
  }

  public set errorMessage(value: string) {
    this.errorMessageData = value
    if (!value) return
    const timerId = Number(
      setTimeout(() => {
        this.errorMessageData = ''
        clearTimeout(timerId)
      }, 2000)
    )
  }

  public async handleSubmit() {
    this.errorMessage = ''
    if (!this.username || !this.password) {
      this.errorMessage = '用户名和密码不能为空'
      return
    }

    this.isLoading = true
    this.apiService.login(this.username, this.password).subscribe((data) => {
      this.isLoading = false
      if (data) {
        this.isSuccess = true
        const timerId = setTimeout(() => {
          clearTimeout(timerId)
          this.authService.setUser(data, this.rememberMe)
          this.isSuccess = false
          this.router.navigate(['/admin/dashboard'])
        }, 1500)
      } else {
        this.errorMessage = '账号或密码错误'
      }
    })
  }

  public forgotPassword() {
    alert('你他妈密码忘了我能咋办？')
  }
}

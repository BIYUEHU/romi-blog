import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Router, RouterLink } from '@angular/router'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'
import { ApiService } from '../../services/api.service'
import { NotifyService } from '../../services/notify.service'
import { MessageBoxType } from '../../shared/types'

@Component({
  selector: 'app-admin-register',
  imports: [FormsModule, RouterLink, WebComponentInputAccessorDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './admin-register.component.html'
})
export class AdminRegisterComponent {
  public username = ''
  public email = ''
  public url = ''
  public isLoading = false

  public constructor(
    private readonly router: Router,
    private readonly apiService: ApiService,
    private readonly notifyService: NotifyService
  ) {}

  public register(): void {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!this.username.trim() || !this.email.trim()) {
      this.notifyService.showMessage('用户名和邮箱不能为空', MessageBoxType.Warning)
      return
    }
    if (!emailRegex.test(this.email)) {
      this.notifyService.showMessage('请输入有效的邮箱地址', MessageBoxType.Warning)
      return
    }
    this.isLoading = true
    this.apiService.register(this.username, this.email, this.url || null).subscribe({
      next: () => {
        this.notifyService.showMessage('注册成功，密码已发送至您的邮箱', MessageBoxType.Success)
        this.router.navigate(['/admin/login'])
        this.isLoading = false
      },
      error: (err) => {
        if (err.status === 400) {
          this.notifyService.showMessage('用户名或邮箱已被注册', MessageBoxType.Error)
        } else {
          this.notifyService.showMessage('注册失败，请稍后重试', MessageBoxType.Error)
        }
        this.isLoading = false
      }
    })
  }
}

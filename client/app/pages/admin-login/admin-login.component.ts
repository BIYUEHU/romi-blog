import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core'
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
export class AdminLoginComponent implements OnInit {
  public username = ''
  public password = ''
  public rememberMe = false
  public isLoading = false

  public constructor(
    private readonly router: Router,
    private readonly apiService: ApiService,
    private readonly authService: AuthService,
    private readonly browserService: BrowserService,
    private readonly layoutService: LayoutService
  ) {}

  public ngOnInit() {
    this.browserService.on(() =>
      this.layoutService.setTitle(`${window.innerWidth >= 768 ? '电脑' : '手机'}哥给我干哪去了啊？？`)
    )
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

import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'
import type { ResSmtpSettings } from '../../models/api.model'
import { ApiService } from '../../services/api.service'
import { NotifyService } from '../../services/notify.service'
import { MessageBoxType } from '../../shared/types'

@Component({
  selector: 'app-admin-smtp',
  imports: [FormsModule, WebComponentInputAccessorDirective],
  templateUrl: './admin-smtp.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AdminSmtpComponent implements OnInit {
  public isLoading = true
  public smtpForm: ResSmtpSettings = {
    smtpHost: '',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    smtpEmail: ''
  }

  public testMail = {
    to: '',
    subject: '',
    content: ''
  }

  public showTestModal = false

  constructor(
    private readonly router: Router,
    private readonly apiService: ApiService,
    private readonly notifyService: NotifyService
  ) {}

  public ngOnInit(): void {
    this.loadSmtpSettings()
  }

  private loadSmtpSettings(): void {
    this.isLoading = true
    this.apiService.getSmtpSettings().subscribe({
      next: (data) => {
        this.smtpForm = data
        this.isLoading = false
      },
      error: () => {
        this.isLoading = false
        this.notifyService.showMessage('加载邮箱设置失败', MessageBoxType.Error)
      }
    })
  }

  public saveSmtpSettings(): void {
    this.apiService.updateSmtpSettings({ ...this.smtpForm, smtpPort: Number(this.smtpForm.smtpPort) }).subscribe({
      next: () => {
        this.notifyService.showMessage('邮箱设置保存成功', MessageBoxType.Success)
      },
      error: () => {
        this.notifyService.showMessage('保存失败', MessageBoxType.Error)
      }
    })
  }

  public openTestModal(): void {
    this.testMail = { to: '', subject: '', content: '' }
    this.showTestModal = true
  }

  public sendTestMail(): void {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!this.testMail.to || !emailRegex.test(this.testMail.to)) {
      this.notifyService.showMessage('请输入有效的邮箱地址', MessageBoxType.Warning)
      return
    }
    if (!this.testMail.content) {
      this.notifyService.showMessage('内容不能为空', MessageBoxType.Warning)
      return
    }
    this.apiService.testSmtp(this.testMail.to, this.testMail.subject, this.testMail.content).subscribe({
      next: () => {
        this.notifyService.showMessage('测试邮件发送成功', MessageBoxType.Success)
        this.showTestModal = false
      },
      error: () => {
        this.notifyService.showMessage('测试邮件发送失败，请检查 SMTP 配置', MessageBoxType.Error)
      }
    })
  }

  public goBack(): void {
    this.router.navigate(['/admin'])
  }
}

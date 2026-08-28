import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { forkJoin } from 'rxjs'
import { WebComponentCheckboxAccessorDirective } from '../../directives/web-component-checkbox-accessor.directive'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'
import type {
  ResBirthdayReminderConfig,
  ResSettingsData,
  ResSettingsDataFriendLink,
  ResSettingsDataHomeLink,
  ResSettingsDataIndependentPage
} from '../../models/api.model'
import { ApiService } from '../../services/api.service'
import { NotifyService } from '../../services/notify.service'
import { MessageBoxType } from '../../shared/types'

@Component({
  selector: 'app-admin-settings',
  imports: [FormsModule, WebComponentInputAccessorDirective, WebComponentCheckboxAccessorDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './admin-settings.component.html'
})
export class AdminSettingsComponent implements OnInit {
  public readonly templateList = [['links', '友情链接']]

  public postIds: number[] = []

  public isLoading = true
  public settingsForm!: ResSettingsData
  public birthdayReminderForm: ResBirthdayReminderConfig = {
    enabled: false,
    hour: 8,
    minute: 0,
    template: '今天是 $name$（$romaji$）的生日，记得送上祝福~\n\n角色简介：\n$description$\n\n—— $site_name$'
  }

  public editingHomeLinkIndex: number | null = null
  public homeLinkForm: ResSettingsDataHomeLink = ['', '', '']

  public editingIndependentPageId: number | null = null
  public independentPageForm: ResSettingsDataIndependentPage = {
    name: '',
    title: '',
    id: 0,
    routine: true,
    hideToc: false,
    hideComments: false,
    template: ''
  }

  public editingFriendLinkIndex: number | null = null
  public friendLinkForm: ResSettingsDataFriendLink = {
    name: '',
    link: '',
    avatar: '',
    description: ''
  }

  constructor(
    private readonly router: Router,
    private readonly apiService: ApiService,
    private readonly notifyService: NotifyService
  ) {}

  public ngOnInit(): void {
    this.loadSettings()
  }

  private loadSettings(): void {
    this.isLoading = true
    this.apiService.getSettings().subscribe((data) => {
      this.settingsForm = data
      this.isLoading = false
    })
    this.apiService.getPosts().subscribe((data) => {
      this.postIds = data.map((p) => p.id)
    })
    this.apiService.getBirthdayReminderConfig().subscribe((data) => {
      this.birthdayReminderForm = data
    })
  }

  public startEditHomeLink(index: number): void {
    this.editingHomeLinkIndex = index
    this.homeLinkForm = [...this.settingsForm.homeLinks[index]]
  }

  public cancelEditHomeLink(): void {
    this.editingHomeLinkIndex = null
    this.homeLinkForm = ['', '', '']
  }

  public saveHomeLink(): void {
    if (!this.homeLinkForm[0] || !this.homeLinkForm[1]) {
      this.notifyService.showMessage('图标和文字不能为空', MessageBoxType.Warning)
      return
    }
    if (!this.homeLinkForm[2]) this.homeLinkForm[2] = ''
    if (this.editingHomeLinkIndex !== null) {
      this.settingsForm.homeLinks[this.editingHomeLinkIndex] = [...this.homeLinkForm]
    } else {
      this.settingsForm.homeLinks.push([...this.homeLinkForm])
    }
    this.cancelEditHomeLink()
  }

  public removeHomeLink(index: number): void {
    this.settingsForm.homeLinks.splice(index, 1)
    if (this.editingHomeLinkIndex === index) this.cancelEditHomeLink()
  }

  public startEditIndependentPage(page: ResSettingsDataIndependentPage): void {
    this.editingIndependentPageId = Number(page.id)
    this.independentPageForm = { ...page }
  }

  public cancelEditIndependentPage(): void {
    this.editingIndependentPageId = null
    this.independentPageForm = {
      name: '',
      title: '',
      id: 0,
      routine: true,
      hideToc: false,
      hideComments: false,
      template: ''
    }
  }

  public saveIndependentPage(): void {
    if (!this.independentPageForm.name || !this.independentPageForm.title || !this.independentPageForm.id) {
      this.notifyService.showMessage('标识名、标题和文章 ID 都不能为空', MessageBoxType.Warning)
      return
    }
    const targetId = Number(this.independentPageForm.id)
    if (this.editingIndependentPageId !== null) {
      const index = this.settingsForm.independentPages.findIndex((p) => Number(p.id) === this.editingIndependentPageId)
      if (index !== -1) {
        this.settingsForm.independentPages[index] = { ...this.independentPageForm, id: targetId }
      }
    } else {
      if (!this.postIds.includes(targetId)) {
        this.notifyService.showMessage(`文章 ${targetId} 不存在`, MessageBoxType.Error)
        return
      }
      if (!this.independentPageForm.routine && this.independentPageForm.template.trim() === '') {
        this.notifyService.showMessage('请选择模板', MessageBoxType.Warning)
        return
      }
      this.settingsForm.independentPages.push({ ...this.independentPageForm, id: targetId })
    }
    this.cancelEditIndependentPage()
  }

  public removeIndependentPage(id: number): void {
    this.settingsForm.independentPages = this.settingsForm.independentPages.filter((p) => p.id !== id)
    if (this.editingIndependentPageId === Number(id)) this.cancelEditIndependentPage()
  }

  public startEditFriendLink(index: number): void {
    this.editingFriendLinkIndex = index
    this.friendLinkForm = { ...this.settingsForm.links[index] }
  }

  public cancelEditFriendLink(): void {
    this.editingFriendLinkIndex = null
    this.friendLinkForm = { name: '', link: '', avatar: '', description: '' }
  }

  public saveFriendLink(): void {
    if (!this.friendLinkForm.name || !this.friendLinkForm.link) {
      this.notifyService.showMessage('名称、链接、头像地址、描述都不能为空', MessageBoxType.Warning)
      return
    }
    if (this.editingFriendLinkIndex !== null) {
      this.settingsForm.links[this.editingFriendLinkIndex] = { ...this.friendLinkForm }
    } else {
      this.settingsForm.links.push({ ...this.friendLinkForm })
    }
    this.cancelEditFriendLink()
  }

  public removeFriendLink(index: number): void {
    this.settingsForm.links.splice(index, 1)
    if (this.editingFriendLinkIndex === index) this.cancelEditFriendLink()
  }

  public saveSettings(): void {
    forkJoin([
      this.apiService.updateSettings(this.settingsForm),
      this.apiService.updateBirthdayReminderConfig({
        ...this.birthdayReminderForm,
        hour: Number(this.birthdayReminderForm.hour),
        minute: Number(this.birthdayReminderForm.minute)
      })
    ]).subscribe(() => this.notifyService.showMessage('保存成功', MessageBoxType.Success))
  }

  public goBack(): void {
    this.router.navigate(['/admin'])
  }
}

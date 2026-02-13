import { DatePipe } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import {
  AbstractAdminBaseListComponent,
  AdminBaseListComponent
} from '../../components/admin-base-list/admin-base-list.component'
import { MessageBoxType } from '../../components/message/message.component'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'
import { ReqUserData, ResUserData, UserAuthData } from '../../models/api.model'
import { ApiService } from '../../services/api.service'
import { AuthService } from '../../services/auth.service'
import { sortByCreatedTime } from '../../shared/utils'

@Component({
  selector: 'app-admin-users',
  imports: [DatePipe, FormsModule, WebComponentInputAccessorDirective, AdminBaseListComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './admin-users.component.html'
})
export class AdminUsersComponent extends AbstractAdminBaseListComponent<ResUserData> implements OnInit {
  public editingUser: ResUserData | true | null = null
  public editForm: ReqUserData = {
    username: '',
    password: '',
    email: '',
    url: null,
    status: 0
  }
  public admin: UserAuthData | null = null

  public constructor(
    private readonly apiService: ApiService,
    public readonly authService: AuthService
  ) {
    super()
    this.emptyMessage = '暂无用户'
  }

  protected loadItems(): void {
    this.isLoading = true
    this.apiService.getUsers().subscribe((data) => {
      this.items = sortByCreatedTime(data, false)
      this.isLoading = false
    })
  }

  protected searchPredicate(user: ResUserData, query: string) {
    return user.username.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)
  }

  protected deleteItem(id: number) {
    if (this.confirmDelete()) {
      this.apiService.deleteUser(id).subscribe(() => {
        this.notifyService.showMessage('删除成功', MessageBoxType.Secondary)
        this.items = this.items.filter((user) => user.uid !== id)
      })
    }
  }

  public startEdit(user?: ResUserData) {
    this.editingUser = user ?? true
    this.editForm = {
      username: user?.username ?? '',
      password: '',
      email: user?.email ?? '',
      url: user?.url ?? null,
      status: user?.status ?? 0
    }
  }

  public cancelEdit() {
    this.editingUser = null
  }

  public updateUser() {
    if (
      !this.editForm.username.trim() ||
      !this.editForm.email.trim() ||
      (!this.editForm.password.trim() && this.editingUser === true)
    ) {
      this.notifyService.showMessage('请填写所有必填项', MessageBoxType.Warning)
      return
    }

    if (this.editingUser && this.editingUser !== true) {
      this.apiService
        .updateUser(this.editingUser.uid, {
          ...this.editForm,
          password: this.editForm.password.trim(),
          status: Number(this.editForm.status)
        })
        .subscribe(() => {
          this.notifyService.showMessage('更新成功', MessageBoxType.Success)
          if ((this.editingUser as ResUserData).uid === this.admin?.id) {
            this.authService.logout()
          }
          this.loadItems()
          this.editingUser = null
        })
    } else {
      this.apiService
        .createUser({
          ...this.editForm,
          password: this.editForm.password.trim(),
          status: Number(this.editForm.status)
        })
        .subscribe(() => {
          this.notifyService.showMessage('创建成功', MessageBoxType.Success)
          this.loadItems()
          this.editingUser = null
        })
    }
  }

  public ngOnInit() {
    this.loadItems()
  }
}

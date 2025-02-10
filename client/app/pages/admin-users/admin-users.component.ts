import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ApiService } from '../../services/api.service'
import { ResUserData, ReqUserData } from '../../../output'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'
import { AuthService } from '../../services/auth.service'
import { UserAuthData } from '../../models/api.model'
import {
  AbstractAdminBaseListComponent,
  AdminBaseListComponent
} from '../../components/admin-base-list/admin-base-list.component'
import { DatePipe } from '@angular/common'

@Component({
  selector: 'app-admin-users',
  standalone: true,
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

  constructor(
    private readonly apiService: ApiService,
    private readonly authService: AuthService
  ) {
    super()
    this.emptyMessage = '暂无用户'
    this.authService.user$.subscribe((user) => {
      this.admin = user
    })
  }

  protected loadItems(): void {
    this.isLoading = true
    this.apiService.getUsers().subscribe({
      next: (data) => {
        this.items = data
        this.isLoading = false
      },
      error: (error) => {
        console.error('Failed to load users:', error)
        this.isLoading = false
      }
    })
  }

  protected searchPredicate(user: ResUserData, query: string): boolean {
    return user.username.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)
  }

  protected deleteItem(id: number): void {
    if (this.confirmDelete()) {
      this.apiService.deleteUser(id).subscribe(() => {
        this.notifyService.showMessage('删除成功', 'secondary')
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
      this.notifyService.showMessage('请填写所有必填项', 'warning')
      return
    }

    if (this.editingUser && this.editingUser !== true) {
      this.apiService
        .updateUser(this.editingUser.uid, {
          ...this.editForm,
          password: this.editForm.password.trim(),
          status: Number(this.editForm.status)
        })
        .subscribe({
          next: () => {
            this.notifyService.showMessage('更新成功', 'success')
            if ((this.editingUser as ResUserData).uid === this.admin?.id) {
              this.authService.logout()
            }
            this.loadItems()
            this.editingUser = null
          },
          error: (error) => {
            console.error('Failed to update user:', error)
            this.notifyService.showMessage('更新失败', 'error')
          }
        })
    } else {
      this.apiService
        .createUser({
          ...this.editForm,
          password: this.editForm.password.trim(),
          status: Number(this.editForm.status)
        })
        .subscribe({
          next: () => {
            this.notifyService.showMessage('创建成功', 'success')
            this.loadItems()
            this.editingUser = null
          },
          error: (error) => {
            console.error('Failed to create user:', error)
            this.notifyService.showMessage('创建失败', 'error')
          }
        })
    }
  }

  public ngOnInit(): void {
    this.loadItems()
  }
}

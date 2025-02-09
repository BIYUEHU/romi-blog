import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { ApiService } from '../../services/api.service'
import { ResUserData, ReqUserData } from '../../../output'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'
import { AuthService } from '../../services/auth.service'
import { UserAuthData } from '../../models/api.model'

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, WebComponentInputAccessorDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './admin-users.component.html'
})
export class AdminUsersComponent implements OnInit {
  public users: ResUserData[] = []
  public isLoading = true
  public searchQuery = ''
  public editingUser: ResUserData | true | null = null
  public editForm: ReqUserData = {
    username: '',
    password: '',
    email: '',
    url: null,
    status: 0
  }
  public admin: UserAuthData | null = null

  // 在 AdminUsersComponent 类中添加这些属性
  public currentPage = 1
  public pageSize = 10
  public pages: number[] = []

  // 添加这些方法
  private updatePagination() {
    const totalPages = Math.ceil(this.filteredUsers.length / this.pageSize)
    this.pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  public goToPage(page: number) {
    this.currentPage = page
  }

  // TODO: 实现分页功能

  // 修改 loadUsers 方法，添加更新分页的调用
  // private loadUsers() {
  //   this.isLoading = true
  //   this.apiService.getUsers().subscribe({
  //     next: (data) => {
  //       this.users = data
  //       this.updatePagination() // 添加这行
  //       this.isLoading = false
  //     },
  //     error: (error) => {
  //       console.error('Failed to load users:', error)
  //       this.isLoading = false
  //     }
  //   })
  // }

  // 添加这个 getter 方法
  public get pagedUsers() {
    const filtered = this.filteredUsers
    const start = (this.currentPage - 1) * this.pageSize
    return filtered.slice(start, start + this.pageSize)
  }

  public constructor(
    private readonly apiService: ApiService,
    private readonly authService: AuthService
  ) {
    this.authService.user$.subscribe((user) => {
      this.admin = user
    })
  }

  public ngOnInit() {
    this.loadUsers()
  }

  private loadUsers() {
    this.isLoading = true
    this.apiService.getUsers().subscribe({
      next: (data) => {
        this.users = data
        this.isLoading = false
      },
      error: (error) => {
        console.error('Failed to load users:', error)
        this.isLoading = false
      }
    })
  }

  public get filteredUsers() {
    return this.users.filter(
      (user) =>
        user.username.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchQuery.toLowerCase())
    )
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
      // TODO: show error message
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
            if ((this.editingUser as ResUserData).uid === this.admin?.id) {
              this.authService.logout()
            }
            this.loadUsers()
            this.editingUser = null
          },
          error: (error) => {
            console.error('Failed to update user:', error)
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
            this.loadUsers()
            this.editingUser = null
          },
          error: (error) => {
            console.error('Failed to create user:', error)
          }
        })
    }
  }

  public deleteUser(id: number, username: string) {
    if (confirm(`确定要删除用户"${username}"吗？`)) {
      this.apiService.deleteUser(id).subscribe({
        next: () => {
          this.users = this.users.filter((user) => user.uid !== id)
        },
        error: (error) => {
          console.error('Failed to delete user:', error)
        }
      })
    }
  }
}

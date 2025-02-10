import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit } from '@angular/core'
import { RouterLink } from '@angular/router'
import { FormsModule } from '@angular/forms'
import { ApiService } from '../../services/api.service'
import { ResPostData } from '../../../output'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'
import {
  AbstractAdminBaseListComponent,
  AdminBaseListComponent
} from '../../components/admin-base-list/admin-base-list.component'
import { DatePipe } from '@angular/common'

@Component({
  selector: 'app-admin-posts',
  standalone: true,
  imports: [DatePipe, RouterLink, FormsModule, WebComponentInputAccessorDirective, AdminBaseListComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './admin-posts.component.html'
})
export class AdminPostsComponent extends AbstractAdminBaseListComponent<ResPostData> implements OnInit {
  public filterStatus = ''

  constructor(private readonly apiService: ApiService) {
    super()
    this.emptyMessage = '暂无文章'
  }

  protected loadItems(): void {
    this.isLoading = true
    this.apiService.getPosts().subscribe({
      next: (data) => {
        this.items = data
        this.isLoading = false
      },
      error: (error) => {
        console.error('Failed to load posts:', error)
        this.isLoading = false
      }
    })
  }

  protected searchPredicate(post: ResPostData, query: string): boolean {
    return post.title.toLowerCase().includes(query)
  }

  protected deleteItem(id: number): void {
    if (this.confirmDelete()) {
      this.apiService.deletePost(id).subscribe(() => {
        this.notifyService.showMessage('文章删除成功', 'secondary')
        this.items = this.items.filter((post) => post.id !== id)
      })
    }
  }

  public ngOnInit(): void {
    this.loadItems()
  }
}

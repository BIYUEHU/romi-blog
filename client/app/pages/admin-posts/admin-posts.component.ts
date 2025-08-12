import { DatePipe } from '@angular/common'
import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import {
  AbstractAdminBaseListComponent,
  AdminBaseListComponent
} from '../../components/admin-base-list/admin-base-list.component'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'
import { ResPostData } from '../../models/api.model'
import { ApiService } from '../../services/api.service'
import { sortByCreatedTime } from '../../utils'

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
    this.notifyService.setTitle('文章管理')
    this.emptyMessage = '暂无文章'
  }

  protected loadItems(): void {
    this.isLoading = true
    this.apiService.getPosts().subscribe((data) => {
      this.items = sortByCreatedTime(data)
      this.isLoading = false
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

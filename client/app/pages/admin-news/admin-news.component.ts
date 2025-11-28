import { DatePipe } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import {
  AbstractAdminBaseListComponent,
  AdminBaseListComponent
} from '../../components/admin-base-list/admin-base-list.component'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'
import { ReqNewsData, ResNewsData } from '../../models/api.model'
import { ApiService } from '../../services/api.service'
import { formatDate, sortByCreatedTime } from '../../utils'

@Component({
    selector: 'app-admin-news',
    imports: [DatePipe, FormsModule, AdminBaseListComponent, WebComponentInputAccessorDirective],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './admin-news.component.html'
})
export class AdminNewsComponent extends AbstractAdminBaseListComponent<ResNewsData> implements OnInit {
  public editingNews: ResNewsData | true | null = null
  public editForm: Omit<ReqNewsData, 'imgs' | 'created'> & { imgs: string; created: string } = {
    created: '',
    modified: 0,
    text: '',
    private: false,
    imgs: ''
  }

  public constructor(private readonly apiService: ApiService) {
    super()
    this.layoutService.setTitle('动态管理')
  }

  protected loadItems(): void {
    this.isLoading = true
    this.apiService.getNewses().subscribe((data) => {
      this.items = sortByCreatedTime(data)
      this.isLoading = false
    })
  }

  protected searchPredicate(news: ResNewsData, query: string): boolean {
    return news.text.toLowerCase().includes(query)
  }

  protected deleteItem(id: number): void {
    if (this.confirmDelete()) {
      this.apiService.deleteNews(id).subscribe(() => {
        this.layoutService.showMessage('删除成功', 'secondary')
        this.items = this.items.filter((news) => news.id !== id)
      })
    }
  }

  public startEdit(news?: ResNewsData) {
    this.editingNews = news ?? true
    this.editForm = {
      created: formatDate(news?.created ? new Date(news.created * 1000) : new Date()),
      modified: news?.modified ?? Math.floor(Date.now() / 1000),
      text: news?.text ?? '',
      private: news?.private ?? false,
      imgs: news?.imgs.join(',') ?? ''
    }
  }

  public cancelEdit() {
    this.editingNews = null
  }

  public updateNews() {
    if (!this.editForm.text.trim()) {
      this.layoutService.showMessage('请填写动态内容', 'warning')
      return
    }

    const data = {
      ...this.editForm,
      hide: this.editForm.private.toString() === 'true',
      created: Math.floor(new Date(this.editForm.created).getTime() / 1000),
      imgs: this.editForm.imgs
        .split(',')
        .map((img) => img.trim())
        .filter((img) => img.length)
    }

    if (this.editingNews && this.editingNews !== true) {
      this.apiService.updateNews(this.editingNews.id, data).subscribe(() => {
        this.layoutService.showMessage('更新成功', 'success')
        this.loadItems()
        this.editingNews = null
      })
    } else {
      this.apiService.createNews(data).subscribe(() => {
        this.layoutService.showMessage('创建成功', 'success')
        this.loadItems()
        this.editingNews = null
      })
    }
  }

  public ngOnInit(): void {
    this.loadItems()
  }
}

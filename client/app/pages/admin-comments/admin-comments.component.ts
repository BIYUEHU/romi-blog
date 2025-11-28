import { DatePipe } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import {
  AbstractAdminBaseListComponent,
  AdminBaseListComponent
} from '../../components/admin-base-list/admin-base-list.component'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'
import { ResCommentData } from '../../models/api.model'
import { ApiService } from '../../services/api.service'
import { sortByCreatedTime } from '../../utils'

@Component({
    selector: 'app-admin-comments',
    imports: [DatePipe, FormsModule, RouterLink, WebComponentInputAccessorDirective, AdminBaseListComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './admin-comments.component.html'
})
export class AdminCommentsComponent extends AbstractAdminBaseListComponent<ResCommentData> {
  public constructor(private readonly apiService: ApiService) {
    super()
    this.layoutService.setTitle('评论管理')
    this.loadItems()
  }

  protected loadItems() {
    this.isLoading = true
    this.apiService.getComments().subscribe((data) => {
      this.items = sortByCreatedTime(data)
      this.isLoading = false
    })
  }

  protected searchPredicate(item: ResCommentData, query: string) {
    return item.text.toLowerCase().includes(query) || item.username.toLowerCase().includes(query)
  }

  public deleteItem(id: number) {
    if (this.confirmDelete()) {
      this.apiService.deleteComment(id).subscribe(() => {
        this.layoutService.showMessage('删除成功', 'secondary')
        this.items = this.items.filter((item) => item.cid !== id)
      })
    }
  }

  public formatText(text: string): string {
    return text.length > 100 ? `${text.slice(0, 100)}...` : text
  }
}

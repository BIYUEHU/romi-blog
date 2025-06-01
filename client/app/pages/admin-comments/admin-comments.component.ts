import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { ApiService } from '../../services/api.service'
import { ResCommentData } from '../../models/api.model'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'
import {
  AbstractAdminBaseListComponent,
  AdminBaseListComponent
} from '../../components/admin-base-list/admin-base-list.component'
import { DatePipe } from '@angular/common'

@Component({
  selector: 'app-admin-comments',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink, WebComponentInputAccessorDirective, AdminBaseListComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './admin-comments.component.html'
})
export class AdminCommentsComponent extends AbstractAdminBaseListComponent<ResCommentData> {
  public constructor(private readonly apiService: ApiService) {
    super()
    this.loadItems()
  }

  protected loadItems() {
    this.isLoading = true
    this.apiService.getComments().subscribe((data) => {
      this.items = data.reverse()
      this.isLoading = false
    })
  }

  protected searchPredicate(item: ResCommentData, query: string) {
    return item.text.toLowerCase().includes(query) || item.username.toLowerCase().includes(query)
  }

  public deleteItem(id: number) {
    if (this.confirmDelete()) {
      this.apiService.deleteComment(id).subscribe(() => {
        this.notifyService.showMessage('删除成功', 'secondary')
        this.items = this.items.filter((item) => item.cid !== id)
      })
    }
  }

  public formatText(text: string): string {
    return text.length > 100 ? `${text.slice(0, 100)}...` : text
  }
}

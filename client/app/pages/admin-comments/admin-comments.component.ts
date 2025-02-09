import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { ApiService } from '../../services/api.service'
import { ResCommentData } from '../../../output'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'

@Component({
  selector: 'app-admin-comments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, WebComponentInputAccessorDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './admin-comments.component.html'
})
export class AdminCommentsComponent implements OnInit {
  public comments: ResCommentData[] = []
  public isLoading = true
  public searchQuery = ''
  public currentPage = 1
  public pageSize = 10
  public get pages() {
    const totalPages = Math.ceil(this.filteredComments.length / this.pageSize)
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  public constructor(private apiService: ApiService) {}

  public ngOnInit() {
    this.loadComments()
  }

  private loadComments() {
    this.isLoading = true
    this.apiService.getComments().subscribe({
      next: (data) => {
        this.comments = data.reverse()
        this.isLoading = false
      },
      error: (error) => {
        console.error('Failed to load comments:', error)
        this.isLoading = false
      }
    })
  }

  public get filteredComments() {
    return this.comments.filter(
      (comment) =>
        comment.text.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        comment.username.toLowerCase().includes(this.searchQuery.toLowerCase())
    )
  }

  public get pagedComments() {
    const filtered = this.filteredComments
    const start = (this.currentPage - 1) * this.pageSize
    return filtered.slice(start, start + this.pageSize)
  }

  public goToPage(page: number) {
    this.currentPage = page
  }

  public deleteComment(id: number) {
    if (confirm('确定要删除这条评论吗？')) {
      this.apiService.deleteComment(id).subscribe({
        next: () => {
          this.comments = this.comments.filter((comment) => comment.cid !== id)
        },
        error: (error) => {
          console.error('Failed to delete comment:', error)
        }
      })
    }
  }

  public formatText(text: string): string {
    return text.length > 100 ? `${text.slice(0, 100)}...` : text
  }
}

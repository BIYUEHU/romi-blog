import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterLink } from '@angular/router'
import { FormsModule } from '@angular/forms'
import { ApiService } from '../../services/api.service'
import { ResPostData } from '../../../output'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'

@Component({
  selector: 'app-admin-posts',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, WebComponentInputAccessorDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './admin-posts.component.html'
})
export class AdminPostsComponent implements OnInit {
  public searchQuery = ''
  public filterStatus = ''
  public currentPage = 1
  public totalPosts = 0
  public get pages() {
    const totalPages = Math.ceil(this.totalPosts / this.pageSize)
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  public pageSize = 10

  public posts: ResPostData[] = []
  public isLoading = true

  public constructor(private apiService: ApiService) {}

  public get filteredPosts() {
    return this.posts.filter((post) => post.title.toLowerCase().includes(this.searchQuery.toLowerCase()))
  }

  public ngOnInit() {
    this.loadPosts()
  }

  private loadPosts() {
    this.isLoading = true
    this.apiService.getPosts().subscribe({
      next: (data) => {
        this.posts = data
        this.totalPosts = this.posts.length
        this.isLoading = false
      },
      error: (error) => {
        console.error('Failed to load posts:', error)
        this.isLoading = false
        // 可以添加错误提示
      }
    })
  }

  public deletePost(id: number) {
    if (confirm('确定要删除这篇文章吗？')) {
      this.apiService.deletePost(id).subscribe({
        next: () => {
          this.posts = this.posts.filter((post) => post.id !== id)
          this.totalPosts = this.posts.length
          // 可以添加成功提示
        },
        error: (error) => {
          console.error('Failed to delete post:', error)
          // 可以添加错误提示
        }
      })
    }
  }

  public goToPage(page: number) {
    this.currentPage = page
  }

  public get pagedPosts() {
    const filtered = this.filteredPosts
    const start = (this.currentPage - 1) * this.pageSize
    return filtered.slice(start, start + this.pageSize)
  }
}

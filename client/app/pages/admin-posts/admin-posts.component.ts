import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterLink } from '@angular/router'
import { FormsModule } from '@angular/forms'

interface PostItem {
  id: number
  title: string
  created: Date
  category: string
  tags: string[]
  views: number
  comments: number
  status: 'published' | 'draft'
}

@Component({
  selector: 'app-admin-post',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './admin-posts.component.html'
})
export class AdminPostsComponent implements OnInit {
  public searchQuery = ''
  public filterStatus = ''
  public currentPage = 1
  public totalPosts = 156
  public pages = [1, 2, 3, 4, 5]

  public posts: PostItem[] = [
    {
      id: 1,
      title: '这是一篇测试文章的标题可能会很长很长很长很长很长',
      created: new Date(),
      category: '技术',
      tags: ['Angular', 'TypeScript', 'Web'],
      views: 123,
      comments: 5,
      status: 'published'
    }
    // ... 更多文章数据
  ]

  get filteredPosts() {
    return this.posts.filter((post) => {
      const matchQuery = post.title.toLowerCase().includes(this.searchQuery.toLowerCase())
      const matchStatus = this.filterStatus ? post.status === this.filterStatus : true
      return matchQuery && matchStatus
    })
  }

  ngOnInit() {
    // 获取文章数据
  }

  public deletePost(id: number) {
    if (confirm('确定要删除这篇文章吗？')) {
      // 实现删除逻辑
      console.log('删除文章:', id)
    }
  }

  public goToPage(page: number) {
    this.currentPage = page
    // 实现分页逻辑
  }
}

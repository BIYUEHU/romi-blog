// admin/pages/home/admin-home.component.ts
import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterLink } from '@angular/router'

interface StatCard {
  title: string
  value: number
  icon: string
  color: string
  link: string
}

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-home.component.html'
})
export class AdminHomeComponent implements OnInit {
  public username = 'BIYUEHU'
  public currentTime = new Date()

  public statCards: StatCard[] = [
    {
      title: '文章数量',
      value: 156,
      icon: 'i-mdi:file-document',
      color: 'bg-primary-100',
      link: '/admin/posts'
    },
    {
      title: '分类数量',
      value: 12,
      icon: 'i-mdi:folder',
      color: 'bg-green-500',
      link: '/admin/categories'
    },
    {
      title: '标签数量',
      value: 48,
      icon: 'i-mdi:tag',
      color: 'bg-yellow-500',
      link: '/admin/tags'
    },
    {
      title: '评论数量',
      value: 328,
      icon: 'i-mdi:comment',
      color: 'bg-blue-500',
      link: '/admin/comments'
    }
  ]

  public recentPosts = [
    {
      id: 1,
      title: '这是一篇测试文章的标题可能会很长很长很长很长很长',
      created: new Date(),
      views: 123,
      comments: 5
    }
    // ... 更多文章
  ]

  public systemInfo = [
    { label: '系统版本', value: 'v1.0.0' },
    { label: 'Node.js 版本', value: 'v18.17.0' },
    { label: 'Angular 版本', value: 'v17.0.0' },
    { label: '服务器系统', value: 'Ubuntu 22.04 LTS' },
    { label: '运行时间', value: '7 天 3 小时' }
  ]

  ngOnInit() {
    // 这里可以添加数据获取逻辑
  }
}

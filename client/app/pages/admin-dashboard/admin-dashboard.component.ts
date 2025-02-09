import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterLink } from '@angular/router'
import { ApiService } from '../../services/api.service'
import { ResDashboardData, ResPostData } from '../../models/api.model'
import { version } from '../../../../package.json'
import { CacheService } from '../../services/cache.service'
import { AuthService } from '../../services/auth.service'
import { BrowserService } from '../../services/browser.service'

interface StatCard {
  title: string
  value: number
  icon: string
  color: string
  link: string
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit {
  public username = ''
  public currentTime = new Date()

  public dashboardData?: ResDashboardData

  public statCards: StatCard[] = [
    {
      title: '文章数量',
      value: 0,
      icon: 'i-mdi:file-document',
      color: 'bg-primary-100',
      link: '/admin/posts'
    },
    {
      title: '分类数量',
      value: 0,
      icon: 'i-mdi:folder',
      color: 'bg-green-500',
      link: '/admin/categories'
    },
    {
      title: '标签数量',
      value: 0,
      icon: 'i-mdi:tag',
      color: 'bg-yellow-500',
      link: '/admin/tags'
    },
    {
      title: '评论数量',
      value: 0,
      icon: 'i-mdi:comment',
      color: 'bg-blue-500',
      link: '/admin/comments'
    },
    {
      title: '用户数量',
      value: 0,
      icon: 'i-mdi:account',
      color: 'bg-purple-500',
      link: '/admin/users'
    },
    {
      title: '一言数量',
      value: 0,
      icon: 'i-mdi:yin-yang',
      color: 'bg-pink-500',
      link: '/admin/hitokotos'
    },
    {
      title: '色图数量',
      value: 0,
      icon: 'i-mdi:palette',
      color: 'bg-red-500',
      link: '/admin/seimgs'
    },
    {
      title: '动态数量',
      value: 0,
      icon: 'i-mdi:newspaper',
      color: 'bg-gray-500',
      link: '/admin/news'
    }
  ]

  private recentPostsData: ResPostData[] = []

  public get recentPosts(): ResPostData[] {
    return this.recentPostsData
  }

  public set recentPosts(value: ResPostData[]) {
    this.recentPostsData = value.sort((a, b) => b.created - a.created).slice(0, 5)
  }

  public systemInfo = [
    { label: '前端版本', value: version },
    { label: '系统版本', value: 'Loading...' },
    { label: 'Node.js 版本', value: 'Loading...' },
    { label: '服务器系统', value: 'Loading...' },
    { label: '运行目录', value: 'Loading...' }
  ]

  public constructor(
    private readonly apiService: ApiService,
    private readonly authService: AuthService,
    private readonly browserService: BrowserService,
    private readonly cacheService: CacheService
  ) {}

  public ngOnInit() {
    if (!this.browserService.isBrowser) return
    this.authService.user$.subscribe((user) => {
      this.username = user?.username ?? ''
    })

    setInterval(() => {
      this.currentTime = new Date()
    }, 1000)

    this.apiService.getDashboard().subscribe((data) => {
      this.statCards = this.statCards.map((card) => ({
        ...card,
        value: Number(data[this.getStatKey(card.title)] || 0)
      }))
      this.systemInfo = [
        { label: '前端版本', value: version },
        { label: '系统版本', value: data.version },
        { label: 'Node.js 版本', value: data.nodejs_version },
        { label: '服务器系统', value: data.os_info },
        { label: '运行目录', value: data.home_dir }
      ]

      this.dashboardData = data
    })

    this.recentPosts = this.cacheService.getCachedData() || []
    if (this.recentPosts.length === 0) {
      this.apiService.getPosts().subscribe((data) => {
        this.recentPosts = data
        this.cacheService.setCacheData(data)
      })
    }
  }

  private getStatKey(title: string): keyof ResDashboardData {
    return (
      (
        {
          文章数量: 'posts_count',
          分类数量: 'categories_count',
          标签数量: 'tags_count',
          评论数量: 'comments_count',
          用户数量: 'users_count',
          一言数量: 'hitokotos_count',
          色图数量: 'seimgs_count',
          动态数量: 'news_count'
        } as const
      )[title] || 'posts_count'
    )
  }
}

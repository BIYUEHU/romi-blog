import { DatePipe } from '@angular/common'
import { Component, OnInit } from '@angular/core'
import { RouterLink } from '@angular/router'
import { ResDashboardData, ResPostData } from '../../models/api.model'
import { ApiService } from '../../services/api.service'
import { BrowserService } from '../../services/browser.service'
import { LayoutService } from '../../services/layout.service'
import { ROMI_METADATA } from '../../shared/constants'

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit {
  public username = ''
  public currentTime = new Date()

  public dashboardData?: ResDashboardData

  public get statCards() {
    return [
      {
        title: '文章数量',
        value: this.dashboardData?.posts_count ?? 0,
        icon: 'i-mdi:file-document',
        color: 'bg-primary-100',
        link: '/admin/posts'
      },
      {
        title: '分类数量',
        value: this.dashboardData?.categories_count ?? 0,
        icon: 'i-mdi:folder',
        color: 'bg-green-500',
        link: '/admin/metas'
      },
      {
        title: '标签数量',
        value: this.dashboardData?.tags_count ?? 0,
        icon: 'i-mdi:tag',
        color: 'bg-yellow-500',
        link: '/admin/metas'
      },
      {
        title: '评论数量',
        value: this.dashboardData?.comments_count ?? 0,
        icon: 'i-mdi:comment',
        color: 'bg-blue-500',
        link: '/admin/comments'
      },
      {
        title: '用户数量',
        value: this.dashboardData?.users_count ?? 0,
        icon: 'i-mdi:account',
        color: 'bg-purple-500',
        link: '/admin/users'
      },
      {
        title: '一言数量',
        value: this.dashboardData?.hitokotos_count ?? 0,
        icon: 'i-mdi:yin-yang',
        color: 'bg-pink-500',
        link: '/admin/hitokotos'
      },
      {
        title: '色图数量',
        value: this.dashboardData?.seimgs_count ?? 0,
        icon: 'i-mdi:palette',
        color: 'bg-red-500',
        link: '/admin/seimgs'
      },
      {
        title: '动态数量',
        value: this.dashboardData?.news_count ?? 0,
        icon: 'i-mdi:newspaper',
        color: 'bg-gray-500',
        link: '/admin/news'
      }
    ]
  }

  public get systemInfo() {
    return [
      { label: '前端版本', value: ROMI_METADATA.pkg.version },
      { label: '系统版本', value: this.dashboardData?.version ?? '' },
      { label: 'Node.js 版本', value: this.dashboardData?.nodejs_version ?? '' },
      { label: '服务器系统', value: this.dashboardData?.os_info ?? '' },
      { label: '用户目录', value: this.dashboardData?.home_dir ?? '' }
    ]
  }

  private recentPostsData: ResPostData[] = []

  public get recentPosts(): ResPostData[] {
    return this.recentPostsData
  }

  public set recentPosts(value: ResPostData[]) {
    this.recentPostsData = value.sort((a, b) => b.created - a.created).slice(0, 5)
  }

  public constructor(
    private readonly apiService: ApiService,
    private readonly browserService: BrowserService,
    private readonly layoutService: LayoutService
  ) {
    this.layoutService.setTitle('控制台')
  }

  public ngOnInit() {
    this.browserService.on(() => {
      setInterval(() => {
        this.currentTime = new Date()
      }, 1000)

      this.apiService.getDashboard().subscribe((data) => {
        this.dashboardData = data
      })

      this.apiService.getPosts().subscribe((data) => {
        this.recentPosts = data
      })
    })
  }
}

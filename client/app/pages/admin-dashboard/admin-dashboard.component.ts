import { DatePipe } from '@angular/common'
import { Component, OnInit } from '@angular/core'
import { RouterLink } from '@angular/router'
import { CardComponent } from '../../components/card/card.component'
import { ResDashboardData, ResPostData } from '../../models/api.model'
import { ApiService } from '../../services/api.service'
import { ROMI_METADATA } from '../../shared/constants'
import { formatDate } from '../../shared/utils'

@Component({
  selector: 'app-admin-dashboard',
  imports: [DatePipe, RouterLink, CardComponent],
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
        value: this.dashboardData?.postsCount ?? 0,
        icon: 'i-mdi:file-document',
        color: 'bg-primary-100',
        link: '/admin/posts'
      },
      {
        title: '分类数量',
        value: this.dashboardData?.categoriesCount ?? 0,
        icon: 'i-mdi:folder',
        color: 'bg-green-500',
        link: '/admin/metas'
      },
      {
        title: '标签数量',
        value: this.dashboardData?.tagsCount ?? 0,
        icon: 'i-mdi:tag',
        color: 'bg-yellow-500',
        link: '/admin/metas'
      },
      {
        title: '评论数量',
        value: this.dashboardData?.commentsCount ?? 0,
        icon: 'i-mdi:comment',
        color: 'bg-blue-500',
        link: '/admin/comments'
      },
      {
        title: '用户数量',
        value: this.dashboardData?.usersCount ?? 0,
        icon: 'i-mdi:account',
        color: 'bg-purple-500',
        link: '/admin/users'
      },
      {
        title: '一言数量',
        value: this.dashboardData?.hitokotosCount ?? 0,
        icon: 'i-mdi:yin-yang',
        color: 'bg-pink-500',
        link: '/admin/hitokotos'
      },
      {
        title: '色图数量',
        value: this.dashboardData?.seimgsCount ?? 0,
        icon: 'i-mdi:palette',
        color: 'bg-red-500',
        link: '/admin/seimgs'
      },
      {
        title: '动态数量',
        value: this.dashboardData?.newsCount ?? 0,
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
      { label: 'Node.js 版本', value: this.dashboardData?.nodejsVersion ?? '' },
      { label: '服务器系统', value: this.dashboardData?.osInfo ?? '' },
      { label: '用户目录', value: this.dashboardData?.homeDir ?? '' },
      { label: '构建时间', value: formatDate(new Date(ROMI_METADATA.build.BUILD_TIME)) },
      { label: '哈希值', value: ROMI_METADATA.build.HASH }
    ]
  }

  private recentPostsData: ResPostData[] = []

  public get recentPosts(): ResPostData[] {
    return this.recentPostsData
  }

  public set recentPosts(value: ResPostData[]) {
    this.recentPostsData = value.sort((a, b) => b.created - a.created).slice(0, 5)
  }

  public constructor(private readonly apiService: ApiService) {}

  public ngOnInit() {
    setInterval(() => {
      this.currentTime = new Date()
    }, 1000)

    this.apiService.getDashboard().subscribe((data) => {
      this.dashboardData = data
    })

    this.apiService.getPosts().subscribe((data) => {
      this.recentPosts = data
    })
  }
}

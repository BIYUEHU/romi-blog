import { DatePipe } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { map } from 'rxjs/operators' // ✅ 导入 map
import { LoadingComponent } from '../../components/loading/loading.component'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'
import { ResNewsData } from '../../models/api.model'
import { AuthService } from '../../services/auth.service'
import { NotifyService } from '../../services/notify.service'
import { sortByCreatedTime } from '../../utils'
import { romiComponentFactory } from '../../utils/romi-component-factory'

interface TocItem {
  year: number
  months: {
    month: number
    count: number
  }[]
}

interface GroupedNews {
  year: number
  month: number
  news: ResNewsData[]
}

@Component({
  selector: 'app-newses',
  standalone: true,
  imports: [RouterLink, DatePipe, FormsModule, WebComponentInputAccessorDirective, LoadingComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './newses.component.html'
})
export class NewsesComponent extends romiComponentFactory<ResNewsData[]>('newses') implements OnInit {
  public isAdmin = false
  public isLoading = true
  public newText = ''
  public displayedNews: ResNewsData[] = []
  public toc: TocItem[] = []
  public currentPage = 1
  private readonly pageSize = 15
  public url = ''
  public groupedNews: GroupedNews[] = []

  public constructor(
    private readonly authService: AuthService,
    private readonly notifyService: NotifyService
  ) {
    super()
    this.notifyService.setTitle('近期动态')
    this.authService.user$.subscribe((user) => {
      this.isAdmin = !!user?.is_admin
    })
  }

  public ngOnInit() {
    this.notifyService.updateHeaderContent({
      title: '近期动态',
      subTitle: []
    })

    this.loadData(this.apiService.getNewses().pipe(map((data) => sortByCreatedTime(data)))).subscribe((data) => {
      this.isLoading = false
      this.refresh(data)
    })

    if (!this.browserService.isBrowser) return
    this.url = `${location.origin}/news`
  }

  private generateToc(news: ResNewsData[]) {
    const yearMap = new Map<number, Map<number, number>>()

    news.forEach((item) => {
      const date = new Date(item.created * 1000)
      const year = date.getFullYear()
      const month = date.getMonth() + 1

      if (!yearMap.has(year)) {
        yearMap.set(year, new Map())
      }
      const monthMap = yearMap.get(year) as Map<number, number>
      monthMap.set(month, (monthMap.get(month) || 0) + 1)
    })

    this.toc = Array.from(yearMap.entries())
      .sort(([a], [b]) => b - a)
      .map(([year, months]) => ({
        year,
        months: Array.from(months.entries())
          .sort(([a], [b]) => b - a)
          .map(([month, count]) => ({ month, count }))
      }))
  }

  public async sendNews() {
    if (!this.newText.trim()) {
      this.notifyService.showMessage('请输入内容', 'warning')
      return
    }

    this.apiService
      .createNews({
        created: Math.floor(Date.now() / 1000),
        modified: Math.floor(Date.now() / 1000),
        text: this.newText,
        hide: false,
        imgs: []
      })
      .subscribe(() => {
        this.notifyService.showMessage('发送成功', 'success')
        this.newText = ''
        this.reloadNews()
      })
  }

  private reloadNews() {
    this.loadData(this.apiService.getNewses().pipe(map((data) => sortByCreatedTime(data)))).subscribe((data) => {
      this.refresh(data)
    })
  }

  private groupNewsByDate(news: ResNewsData[]) {
    const groups = new Map<string, ResNewsData[]>()

    news.forEach((item) => {
      const date = new Date(item.created * 1000)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const key = `${year}-${month}`

      if (!groups.has(key)) {
        groups.set(key, [])
      }
      ;(groups.get(key) as ResNewsData[]).push(item)
    })

    return Array.from(groups.entries())
      .map(([key, items]) => {
        const [year, month] = key.split('-').map(Number)
        return { year, month, news: items }
      })
      .sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year
        return b.month - a.month
      })
  }

  private refresh(data: ResNewsData[]) {
    const grouped = this.groupNewsByDate(data)
    this.groupedNews = grouped
    this.displayedNews = grouped
      .slice(0, this.currentPage)
      .flatMap((group) => group.news)
      .slice(0, this.pageSize)
    this.generateToc(data)
  }

  public loadMore() {
    const allNews = this.groupedNews.flatMap((group) => group.news)
    const nextItems = allNews.slice(this.currentPage * this.pageSize, (this.currentPage + 1) * this.pageSize)
    if (nextItems.length === 0) {
      this.notifyService.showMessage('没有更多了', 'info')
      return
    }
    this.displayedNews = [...this.displayedNews, ...nextItems]
    this.currentPage++
  }
}

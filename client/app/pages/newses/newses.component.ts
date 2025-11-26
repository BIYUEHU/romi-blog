import { DatePipe } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA, effect, Input, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { map } from 'rxjs/operators'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'
import { ResNewsData } from '../../models/api.model'
import { ApiService } from '../../services/api.service'
import { AuthService } from '../../services/auth.service'
import { LayoutService } from '../../services/layout.service'
import { sortByCreatedTime } from '../../utils'

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
  imports: [RouterLink, DatePipe, FormsModule, WebComponentInputAccessorDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './newses.component.html'
})
export class NewsesComponent implements OnInit {
  private static readonly PAGE_SIZE = 15

  @Input() public newses!: ResNewsData[]

  public isAdmin = false
  public newText = ''
  public displayedNews: ResNewsData[] = []
  public groupedNews: GroupedNews[] = []
  public toc: TocItem[] = []
  public currentPage = 1

  public constructor(
    private readonly layoutService: LayoutService,
    private readonly apiService: ApiService,
    authService: AuthService
  ) {
    effect(() => {
      const user = authService.user$()
      this.isAdmin = !!user?.is_admin
    })
  }

  public ngOnInit() {
    this.layoutService.setTitle('近期动态')
    this.layoutService.updateHeader({
      title: '近期动态',
      subTitle: []
    })
    this.newses = sortByCreatedTime(this.newses)
    this.refresh()
  }

  public async sendNews() {
    if (!this.newText.trim()) {
      this.layoutService.showMessage('请输入内容', 'warning')
      return
    }

    this.apiService
      .createNews({
        created: Math.floor(Date.now() / 1000),
        modified: Math.floor(Date.now() / 1000),
        text: this.newText,
        private: false,
        imgs: []
      })
      .subscribe(() => {
        this.layoutService.showMessage('发送成功', 'success')
        this.newText = ''
        this.reloadNews()
      })
  }

  private reloadNews() {
    this.apiService
      .getNewses()
      .pipe(map((data) => sortByCreatedTime(data)))
      .subscribe((data) => {
        this.newses = data
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

  private refresh() {
    const grouped = this.groupNewsByDate(this.newses)
    this.groupedNews = grouped
    this.displayedNews = grouped
      .slice(0, this.currentPage)
      .flatMap((group) => group.news)
      .slice(0, NewsesComponent.PAGE_SIZE)

    const yearMap = new Map<number, Map<number, number>>()
    for (const item of this.newses) {
      const date = new Date(item.created * 1000)
      const year = date.getFullYear()
      const month = date.getMonth() + 1

      if (!yearMap.has(year)) {
        yearMap.set(year, new Map())
      }
      const monthMap = yearMap.get(year) as Map<number, number>
      monthMap.set(month, (monthMap.get(month) || 0) + 1)
    }
    this.toc = Array.from(yearMap.entries())
      .sort(([a], [b]) => b - a)
      .map(([year, months]) => ({
        year,
        months: Array.from(months.entries())
          .sort(([a], [b]) => b - a)
          .map(([month, count]) => ({ month, count }))
      }))
  }

  public loadMore() {
    const allNews = this.groupedNews.flatMap((group) => group.news)
    const nextItems = allNews.slice(
      this.currentPage * NewsesComponent.PAGE_SIZE,
      (this.currentPage + 1) * NewsesComponent.PAGE_SIZE
    )
    if (nextItems.length === 0) {
      this.layoutService.showMessage('没有更多了', 'info')
      return
    }
    this.displayedNews = [...this.displayedNews, ...nextItems]
    this.currentPage++
  }
}

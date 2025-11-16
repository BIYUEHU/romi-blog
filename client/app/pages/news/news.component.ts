import { DatePipe } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnDestroy, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { ResNewsData } from '../../../output'
import { LoadingComponent } from '../../components/loading/loading.component'
import { ApiService } from '../../services/api.service'
import { BrowserService } from '../../services/browser.service'
import { NotifyService } from '../../services/notify.service'
import { KEYS } from '../../services/store.service'

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [DatePipe, LoadingComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './news.component.html'
})
export class NewsComponent implements OnInit, OnDestroy {
  @Input() public news!: ResNewsData

  private viewedTimeoutId?: number

  public constructor(
    private readonly router: Router,
    private readonly notifyService: NotifyService,
    private readonly browserService: BrowserService,
    private readonly apiService: ApiService
  ) {}

  public ngOnInit() {
    this.notifyService.setTitle(this.news.text)
    this.updateHeaderContent()
    this.viewNews()
  }

  public ngOnDestroy() {
    if (this.viewedTimeoutId) clearTimeout(this.viewedTimeoutId)
  }

  public viewNews() {
    if (!this.browserService.isBrowser || this.browserService.store?.getItem(KEYS.NEWS_VIEWED(this.news.id))) return
    this.viewedTimeoutId = Number(
      setTimeout(
        () =>
          this.apiService
            .viewNews(this.news.id)
            .subscribe(() => this.browserService.store?.setItem(KEYS.NEWS_VIEWED(this.news.id), true)),
        5000
      )
    )
  }

  public likeNews() {
    if (this.browserService.store?.getItem(KEYS.NEWS_LIKED(this.news.id))) {
      this.notifyService.showMessage('已经点过赞了', 'warning')
      return
    }
    this.apiService.likeNews(this.news.id).subscribe(() => {
      this.browserService.store?.setItem(KEYS.NEWS_LIKED(this.news.id), true)
      if (this.news) this.news.likes += 1
      this.updateHeaderContent()
      this.notifyService.showMessage('点赞成功', 'success')
    })
  }

  public async shareNews() {
    const copyText = `${this.news.text.slice(0, 25)}${this.news && this.news.text.length > 25 ? '...' : ''} - ${((
      ref
    ) => (ref ? `${ref.location.origin}${this.router.url.split('#')[0]}` : ''))(this.browserService.windowRef)}`
    try {
      await navigator.clipboard.writeText(copyText)
      this.notifyService.showMessage('链接已复制到剪贴板', 'success')
    } catch (_) {
      this.notifyService.showMessage('链接复制失败', 'error')
    }
  }

  public updateHeaderContent() {
    this.notifyService.updateHeaderContent({
      title: '动态详情',
      subTitle: [`${this.news.views} 次阅读 • ${this.news.comments} 条评论 • ${this.news.likes} 人喜欢`]
    })
  }
}

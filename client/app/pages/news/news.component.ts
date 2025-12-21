import { DatePipe, NgOptimizedImage } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnDestroy, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { ResNewsData } from '../../../output'
import { ApiService } from '../../services/api.service'
import { BrowserService } from '../../services/browser.service'
import { NotifyService } from '../../services/notify.service'
import { STORE_KEYS, StoreService } from '../../services/store.service'

@Component({
  selector: 'app-news',
  imports: [DatePipe, NgOptimizedImage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './news.component.html'
})
export class NewsComponent implements OnInit, OnDestroy {
  @Input() public news!: ResNewsData

  private viewedTimeoutId?: number

  public constructor(
    private readonly router: Router,
    private readonly notifyService: NotifyService,
    private readonly apiService: ApiService,
    private readonly browserService: BrowserService,
    private readonly storeService: StoreService
  ) {}

  public ngOnInit() {
    this.browserService.on(() => {
      if (this.storeService.getItem(STORE_KEYS.newsViewed(this.news.id))) return
      this.viewedTimeoutId = Number(
        setTimeout(
          () =>
            this.apiService
              .viewNews(this.news.id)
              .subscribe(() => this.storeService.setItem(STORE_KEYS.newsViewed(this.news.id), true)),
          5000
        )
      )
    })
  }

  public ngOnDestroy() {
    if (this.viewedTimeoutId) clearTimeout(this.viewedTimeoutId)
  }

  public likeNews() {
    if (this.storeService.getItem(STORE_KEYS.newsLiked(this.news.id))) {
      this.notifyService.showMessage('已经点过赞了', 'warning')
      return
    }
    this.apiService.likeNews(this.news.id).subscribe(() => {
      this.storeService.setItem(STORE_KEYS.newsLiked(this.news.id), true)
      if (this.news) this.news.likes += 1
      // this.updateHeader()  TODO
      this.notifyService.showMessage('点赞成功', 'success')
    })
  }

  public async shareNews() {
    const copyText = `${this.news.text.slice(0, 25)}${this.news && this.news.text.length > 25 ? '...' : ''} - ${this.browserService.on(() => `${location.origin}${this.router.url.split('#')[0]}`) ?? ''}`
    try {
      await navigator.clipboard.writeText(copyText)
      this.notifyService.showMessage('链接已复制到剪贴板', 'success')
    } catch (_) {
      this.notifyService.showMessage('链接复制失败', 'error')
    }
  }
}

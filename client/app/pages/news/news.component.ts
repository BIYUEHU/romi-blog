import { DatePipe } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnDestroy, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { LoadingComponent } from '../../components/loading/loading.component'
import { ResNewsData } from '../../models/api.model'
import { NotifyService } from '../../services/notify.service'
import { KEYS } from '../../services/store.service'
import { romiComponentFactory } from '../../utils/romi-component-factory'

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [DatePipe, LoadingComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './news.component.html'
})
export class NewsComponent extends romiComponentFactory<ResNewsData>('news') implements OnInit, OnDestroy {
  private viewedTimeoutId?: number

  public isLoading = true

  public constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly notifyService: NotifyService
  ) {
    super()
  }

  public ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'))
    if (Number.isNaN(id) || id <= 0) {
      this.router.navigate(['/404']).then(() => {})
      return
    }
    this.load(this.apiService.getNews(id), (data) => {
      this.isLoading = false
      this.notifyService.setTitle(data.text)
      this.updateHeaderContent()
      this.viewNews()
    })
  }

  public ngOnDestroy() {
    if (this.viewedTimeoutId) clearTimeout(this.viewedTimeoutId)
  }

  public viewNews() {
    const id = this.data?.id
    if (!id) return
    if (!this.browserService.isBrowser || this.browserService.store?.getItem(KEYS.NEWS_VIEWED(id))) return
    this.viewedTimeoutId = Number(
      setTimeout(
        () =>
          this.apiService.viewNews(id).subscribe(() => this.browserService.store?.setItem(KEYS.NEWS_VIEWED(id), true)),
        5000
      )
    )
  }

  public likeNews() {
    const id = this.data?.id
    if (!id) return
    if (this.browserService.store?.getItem(KEYS.NEWS_LIKED(id))) {
      this.notifyService.showMessage('已经点过赞了', 'warning')
      return
    }
    this.apiService.likeNews(id).subscribe(() => {
      this.browserService.store?.setItem(KEYS.NEWS_LIKED(id), true)
      if (this.data) this.data.likes += 1
      this.updateHeaderContent()
      this.notifyService.showMessage('点赞成功', 'success')
    })
  }

  public async shareNews() {
    const copyText = `${this.data?.text.slice(0, 25)}${this.data && this.data.text.length > 25 ? '...' : ''} - ${((
      ref
    ) => (ref ? `${ref.location.origin}${this.router.url.split('#')[0]}` : ''))(this.browserService.windowRef)}`
    try {
      await navigator.clipboard.writeText(copyText)
      this.notifyService.showMessage('链接已复制到剪贴板', 'success')
    } catch (_) {
      this.notifyService.showMessage('链接复制失败', 'error')
    }
  }

  private updateHeaderContent() {
    const { data } = this
    if (!data) return
    this.notifyService.updateHeaderContent({
      title: '动态详情',
      subTitle: [`${data.views} 次阅读 • ${data.comments} 条评论 • ${data.likes} 人喜欢`]
    })
  }
}

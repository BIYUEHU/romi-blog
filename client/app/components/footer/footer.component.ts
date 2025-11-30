import { DatePipe } from '@angular/common'
import { Component, OnInit } from '@angular/core'
import { RouterLink } from '@angular/router'
import { map } from 'rxjs'
import { ResHitokotoData } from '../../../output'
import { ApiService } from '../../services/api.service'
import { BrowserService } from '../../services/browser.service'
import { STORE_KEYS, StoreService } from '../../services/store.service'
import { ROMI_METADATA } from '../../shared/constants'

@Component({
  selector: 'app-footer',
  imports: [RouterLink, DatePipe],
  templateUrl: './footer.component.html'
})
export class FooterComponent implements OnInit {
  public get metadata() {
    return this.storeService.getItem(STORE_KEYS.IS_DEBUG) === 'true' ? ROMI_METADATA : null
  }

  public currentTime = this.getTimeString()

  public footerItems = [
    { link: '/feed', text: 'RSS 订阅' },
    { link: '/sitemap.xml', text: '网站地图' },
    { link: '/links', text: '友情链接' }
  ]

  public data?: ResHitokotoData

  public constructor(
    private readonly apiService: ApiService,
    private readonly storeService: StoreService,
    private readonly browserService: BrowserService
  ) {}

  public ngOnInit() {
    this.apiService
      .getHitokoto()
      .pipe(
        map((data) => {
          const msg = data.msg.length > 30 ? `${data.msg.substring(0, 25)}...` : data.msg
          return { ...data, msg: `${msg}${data.from.trim() ? ` —— ${data.from}` : ''}` }
        })
      )
      .subscribe((data) => {
        this.data = data
      })

    this.browserService.on(() =>
      setInterval(() => {
        this.currentTime = this.getTimeString()
      }, 1000)
    )
  }

  public getTimeString() {
    const diff = (Date.now() - new Date('2019-01-01T00:00:00Z').getTime()) / 1000
    return `${Math.floor(diff / 86400)} 天 ${Math.floor((diff % 86400) / 3600)} 小时 ${Math.floor((diff % 3600) / 60)} 分钟 ${Math.floor(diff % 60)} 秒`
  }
}

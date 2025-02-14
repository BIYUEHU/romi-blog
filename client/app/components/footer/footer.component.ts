import { Component, OnInit } from '@angular/core'
import { RouterLink } from '@angular/router'
import { ResHitokotoData } from '../../models/api.model'
import { romiComponentFactory } from '../../utils/romi-component-factory'

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.component.html'
})
export class FooterComponent extends romiComponentFactory<ResHitokotoData>('footer') implements OnInit {
  public currentTime = this.getTimeString()

  public hitokoto?: ResHitokotoData

  public ngOnInit() {
    this.setData(
      (set) => this.apiService.getHitokoto().subscribe((data) => set(data)),
      (data) => {
        this.hitokoto = {
          ...data,
          msg: `${data.msg.length > 30 ? `${data.msg.substring(0, 25)}...` : data.msg}${data.from.trim() ? ` —— ${data.from}` : ''}`
        }
      }
    )

    if (!this.browserService.isBrowser) return
    setInterval(() => {
      this.currentTime = this.getTimeString()
    }, 1000)
  }

  public getTimeString() {
    const diff = (Date.now() - new Date('2019-01-01T00:00:00Z').getTime()) / 1000
    return `${Math.floor(diff / 86400)} 天 ${Math.floor((diff % 86400) / 3600)} 小时 ${Math.floor((diff % 3600) / 60)} 分钟 ${Math.floor(diff % 60)} 秒`
  }

  public footerItems = [
    { link: '/feed', text: 'RSS 订阅', vanilla: true },
    { link: '/sitemap.xml', text: '网站地图', vanilla: true },
    { link: '/friends', text: '友情链接' }
  ]
}

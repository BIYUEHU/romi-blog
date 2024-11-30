import { Component, OnInit } from '@angular/core'
import { RouterLink } from '@angular/router'
import { BlogService } from '../../services/blog.service'
import { ExternalHitokoto } from '../../models/blog.model'

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.component.html'
})
export class FooterComponent implements OnInit {
  public currentTime = ''

  public hitokoto?: ExternalHitokoto['data'] & { url: string }

  public constructor(private blogService: BlogService) {}

  public ngOnInit() {
    setInterval(() => {
      this.currentTime = this.getTimeString()
    }, 1000)

    this.blogService.getHitokoto().subscribe(({ data }) => {
      this.hitokoto = {
        ...data,
        msg: `${data.msg.length > 30 ? `${data.msg.substring(0, 25)}...` : data.msg}${data.from ? ` —— ${data.from}` : ''}`,
        url: `https://hotaru.icu/hitokoto.html?id=${btoa(data.id.toString())}`
      }
    })
  }

  public getTimeString() {
    const date = new Date('2019-01-01T00:00:00Z')
    const now = new Date()
    const diff = (now.getTime() - date.getTime()) / 1000
    return `${Math.floor(diff / 86400)} 天 ${Math.floor((diff % 86400) / 3600)} 小时 ${Math.floor((diff % 3600) / 60)} 分钟 ${Math.floor(diff % 60)} 秒`
  }

  public footerItems = [
    { link: '/feed', text: 'RSS 订阅', vanilla: true },
    { link: '/sitemap.xml', text: '网站地图', vanilla: true },
    { link: '/friends', text: '友情链接' }
  ]
}

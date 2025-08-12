import { Component, Input } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { CardComponent } from '../../components/card/card.component'
import { PostContentComponent } from '../../components/post-content/post-content.component'
import { NotifyService } from '../../services/notify.service'

interface ResFriendData {
  name: string
  link: string
  avatar: string
  description: string
}

@Component({
  selector: 'app-links',
  standalone: true,
  imports: [FormsModule, PostContentComponent, CardComponent],
  templateUrl: './links.component.html'
})
export class LinksComponent {
  @Input({ required: true }) public id!: number

  public links: ResFriendData[] = [
    {
      name: 'RomiBlog',
      link: 'https://hotaru.icu',
      avatar: '/favicon.ico',
      description: 'ArimuraSena 的个人网站'
    },
    {
      name: 'KanaRhythm',
      link: 'https://kana.hotaru.icu/',
      avatar: 'https://kana.hotaru.icu/favicon.png',
      description: '基于 MoonBit 的日语假名学习游戏'
    },
    {
      name: 'Nanno',
      link: 'http://gal.hotaru.icu/',
      avatar: 'http://gal.hotaru.icu/assets/cover.png',
      description: '基于 Tauri 的 GAL 管理工具'
    },
    {
      name: 'SenaTab',
      link: 'https://st.hotaru.icu/',
      avatar: 'https://st.hotaru.icu/icons/icon.png',
      description: '基于 React 的浏览器起始页'
    },
    {
      name: 'KotoriDoc',
      link: 'https://kotori.js.org',
      avatar: 'https://kotori.js.org/favicon.svg',
      description: '基于 TS 跨平台聊天机器人框架'
    },
    {
      name: 'HULITOOL',
      link: 'https://tool.hotaru.icu',
      avatar: 'https://tool.hotaru.icu/favicon.ico',
      description: 'HULITOOL 工具箱'
    },
    {
      name: 'HotaruApi',
      link: 'https://api.hotaru.icu',
      avatar: 'https://api.hotaru.icu/favicon.ico',
      description: '超快超稳定的接口网站'
    }
  ]

  public constructor(private readonly notifyService: NotifyService) {
    this.notifyService.setTitle('友情链接')
  }
}

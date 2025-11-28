import { NgOptimizedImage } from '@angular/common'
import { Component, Input } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ResPostSingleData } from '../../../output'
import { LayoutService } from '../../services/layout.service'
import { CardComponent } from '../card/card.component'
import { PostContentComponent } from '../post-content/post-content.component'

interface ResFriendData {
  name: string
  link: string
  avatar: string
  description: string
}

@Component({
  selector: 'app-links',
  standalone: true,
  imports: [FormsModule, PostContentComponent, CardComponent, NgOptimizedImage],
  templateUrl: './links.component.html'
})
export class LinksComponent {
  @Input({ required: true }) public post!: ResPostSingleData

  public links: ResFriendData[] = [
    {
      name: 'RomiBlog',
      link: 'https://hotaru.icu',
      avatar: '/favicon.ico',
      description: 'ArimuraSena 的个人网站'
    },
    {
      name: 'Sena Language',
      link: 'https://l.himeno-sena.com',
      avatar: 'https://l.himeno-sena.com/favicon-7a447ed069013842.ico',
      description: '基于 Rust 的实验性一等类型&依赖类型编程语言'
    },
    {
      name: 'Himeno Sena',
      link: 'https://himeno-sena.com',
      avatar: 'https://himeno-sena.com/favicon.ico',
      description: '姬野星奏的专属网站'
    },
    {
      name: 'KanaRhythm',
      link: 'https://kana.hotaru.icu/',
      avatar: 'https://kana.hotaru.icu/favicon.png',
      description: '基于 MoonBit 语言的日语假名学习游戏'
    },
    {
      name: 'Nanno',
      link: 'https://gal.hotaru.icu/',
      avatar: 'https://gal.hotaru.icu/assets/cover.png',
      description: '基于 Rust 的 GAL 管理、统计、同步工具'
    },
    {
      name: 'SenaTab',
      link: 'https://st.hotaru.icu/',
      avatar: 'https://st.hotaru.icu/icons/icon.png',
      description: '基于 React 的浏览器起始页'
    },
    {
      name: 'AvgJS',
      link: 'https://avg.js.org',
      avatar: 'https://avg.js.org/favicon.svg',
      description: '轻量级视觉小说游戏制作引擎'
    },
    {
      name: 'KotoriDoc',
      link: 'https://kotori.js.org',
      avatar: 'https://kotori.js.org/favicon.svg',
      description: 'TS 跨平台聊天机器人框架'
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

  public constructor(private readonly layoutService: LayoutService) {
    this.layoutService.setTitle('友情链接')
  }
}

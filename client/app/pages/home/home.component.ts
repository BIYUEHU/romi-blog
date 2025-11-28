import { DatePipe, NgOptimizedImage } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnDestroy, OnInit } from '@angular/core'
import { ResolveFn, RouterLink } from '@angular/router'
import { CardComponent } from '../../components/card/card.component'
import { LayoutComponent } from '../../components/layout/layout.component'
import { ProjectListComponent } from '../../components/project-list/project-list.component'
import { LayoutService } from '../../services/layout.service'
import { APlayer } from '../../shared/types'
import type { homeResolver } from './home.resolver'

@Component({
    selector: 'app-home',
    imports: [DatePipe, RouterLink, ProjectListComponent, CardComponent, LayoutComponent, NgOptimizedImage],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit, OnDestroy {
  @Input() public readonly home!: typeof homeResolver extends ResolveFn<infer T> ? T : never

  private aplayer?: APlayer

  public readonly header = {
    title: 'Arimura Sena',
    subTitle: [
      '👋 Hi there, this is my personal website and blog',
      "🔧 It's frontend built with Angular and Lit, backend built with Rocket and SeaORM",
      '🧩 The best like character is Himeno Sena (姬野星奏) and Arimura Romi (有村ロミ)',
      "🌱 I'm currently learning Idris2 and Type Theory"
    ],
    links: [
      ['i-mdi:github', 'GitHub', 'https://github.com/biyuehu'],
      ['i-mdi:email', 'Email', 'mailto:me@hotaru.icu'],
      ['i-mdi:qqchat', 'QQ', 'https://qm.qq.com/q/QbbNiQ6Tq6'],
      ['i-mdi:television-classic', 'BiliBili', 'https://space.bilibili.com/293767574'],
      ['i-mdi:animation-play', 'Bangumi', 'https://bgm.tv/user/himeno'],
      ['i-mdi:youtube', 'YouTube', 'https://youtube.com/@nagisa_1224'],
      ['i-mdi:alpha-x-box', 'X', 'https://twitter.com/BIYUEHU3'],
      ['i-mdi:square-rounded-badge', 'Tieba', ''],
      ['i-mdi:telegram', 'Telegram'],
      ['i-mdi:steam', 'Steam', ''],
      ['i-mdi:reddit', 'Reddit'],
      ['i-mdi:discord', 'Discord'],
      ['i-mdi:xbox', 'Xbox', '']
    ],
    avatarUrl: '/api/utils/qqavatar'
  }

  public constructor(private readonly layoutService: LayoutService) {}

  public ngOnInit() {
    this.layoutService.setTitle()
    this.layoutService.updateHeader({
      title: '',
      subTitle: []
    })

    // if (!this.browserService.is || !this.home.music.length) return
    // this.aplayer = new APlayer({
    //   container: document.getElementById('recent-music'),
    //   theme: 'var(--primary-100)',
    //   listMaxHeight: '320px',
    //   audio: this.home.music
    // })
  }

  public ngOnDestroy() {
    this.aplayer?.destroy()
  }
}

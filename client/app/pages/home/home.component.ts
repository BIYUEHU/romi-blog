import { CUSTOM_ELEMENTS_SCHEMA, Component, OnDestroy, OnInit } from '@angular/core'
import { DatePipe } from '@angular/common'
import { RouterLink } from '@angular/router'
import { ResNewsData, ResPostData, ResProjectData, Video } from '../../models/api.model'
import { APlayer } from '../../shared/types'
import musicList from '../../shared/music.json'
import { ProjectListComponent } from '../../components/project-list/project-list.component'
import { LayoutUsingComponent } from '../../components/layout-using/layout-using.component'
import { LoadingComponent } from '../../components/loading/loading.component'
import { NotifyService } from '../../services/notify.service'
import { ApiService } from '../../services/api.service'
import { BrowserService } from '../../services/browser.service'
import { CardComponent } from '../../components/card/card.component'

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [DatePipe, RouterLink, ProjectListComponent, LayoutUsingComponent, LoadingComponent, CardComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit, OnDestroy {
  public posts?: ResPostData[]
  public news?: ResNewsData[]
  public videos?: Video[]
  public projects?: ResProjectData[]
  private aplayer?: APlayer
  public header = {
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
    ]
  }

  public constructor(
    private readonly notifyService: NotifyService,
    private readonly apiService: ApiService,
    private readonly browserService: BrowserService
  ) {}

  private initAplayer() {
    this.aplayer = new APlayer({
      container: document.getElementById('recent-music'),
      theme: 'var(--primary-100)',
      listMaxHeight: '320px',
      audio: musicList
    })
  }

  public ngOnInit() {
    this.notifyService.updateHeaderContent({ title: '', subTitle: [] })
    this.apiService.getPosts().subscribe((data) => {
      this.posts = data
        .filter(({ hide }) => !hide)
        .slice(0, 4)
        .sort((a, b) => b.created - a.created)
    })
    this.apiService.getNewses().subscribe((data) => {
      this.news = data.slice(0, 4).sort((a, b) => b.created - a.created)
    })
    this.apiService.getVideos().subscribe((data) => {
      this.videos = data.slice(0, 4).sort((a, b) => b.created - a.created)
    })
    this.apiService.getProjects().subscribe((data) => {
      this.projects = data.slice(0, 4)
    })
    setTimeout(() => {
      if (this.browserService.isBrowser) this.initAplayer()
    }, 0)
  }

  public ngOnDestroy() {
    this.aplayer?.destroy()
  }
}

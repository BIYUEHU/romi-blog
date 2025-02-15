import { CUSTOM_ELEMENTS_SCHEMA, Component, OnDestroy, OnInit } from '@angular/core'
import { DatePipe } from '@angular/common'
import { RouterLink } from '@angular/router'
import { Repository, ResPostData } from '../../models/api.model'
import { ResNewsData } from '../../models/api.model'
import { Video } from '../../models/api.model'
import { APlayer } from '../../shared/types'
import musicList from '../../shared/music.json'
import { romiComponentFactory } from '../../utils/romi-component-factory'
import { observableToPromise } from '../../utils'
import { Observable } from 'rxjs'
import { ProjectListComponent } from '../../components/project-list/project-list.component'
import { LayoutUsingComponent } from '../../components/layout-using/layout-using.component'
import { LoadingComponent } from '../../components/loading/loading.component'
import { LoggerService } from '../../services/logger.service'
import { NotifyService } from '../../services/notify.service'

type HomeData = [ResPostData[], ResNewsData[], Video[], Repository[]]

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [DatePipe, RouterLink, ProjectListComponent, LayoutUsingComponent, LoadingComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './home.component.html'
})
export class HomeComponent extends romiComponentFactory<HomeData>('home') implements OnInit, OnDestroy {
  public isLoading = true
  public posts: ResPostData[] = []
  public news: ResNewsData[] = []
  public videos: Video[] = []
  public projects: Repository[] = []
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
    private readonly loggerService: LoggerService,
    private readonly notifyService: NotifyService
  ) {
    super()
  }

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
    this.setData(
      (set) =>
        Promise.all(
          [
            this.apiService.getPosts(),
            this.apiService.getNewses(),
            this.apiService.getVideos(),
            this.apiService.getProjects()
          ].map((item) =>
            observableToPromise(item as Observable<object>).catch((err) => {
              this.loggerService.error(err)
              return []
            })
          )
        ).then((data) => set(data as HomeData)),
      ([posts, news, videos, projects]) => {
        this.isLoading = false
        this.posts = posts.slice(0, 4)
        this.news = news.slice(0, 4)
        this.videos = videos.slice(0, 4)
        this.projects = projects.slice(0, 4)
        setTimeout(() => {
          if (this.browserService.isBrowser) this.initAplayer()
        }, 0)
      }
    )
  }

  public ngOnDestroy() {
    this.aplayer?.destroy()
  }
}

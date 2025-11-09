import { DatePipe } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnDestroy, OnInit } from '@angular/core'
import { RouterLink } from '@angular/router'
import { forkJoin, map } from 'rxjs'
import { CardComponent } from '../../components/card/card.component'
import { LayoutUsingComponent } from '../../components/layout-using/layout-using.component'
import { LoadingComponent } from '../../components/loading/loading.component'
import { ProjectListComponent } from '../../components/project-list/project-list.component'
import { ResMusicData, ResNewsData, ResPostData, ResProjectData, Video } from '../../models/api.model'
import { NotifyService } from '../../services/notify.service'
import { API_BASE_URL } from '../../shared/constants'
import { APlayer } from '../../shared/types'
import { romiComponentFactory } from '../../utils/romi-component-factory'

type HomeData = {
  posts: ResPostData[]
  news: ResNewsData[]
  videos: Video[]
  projects: ResProjectData[]
  music: ResMusicData[]
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [DatePipe, RouterLink, ProjectListComponent, LayoutUsingComponent, LoadingComponent, CardComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './home.component.html'
})
export class HomeComponent extends romiComponentFactory<HomeData>('Home') implements OnInit, OnDestroy {
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
    ],
    avatarUrl: `${API_BASE_URL}/utils/qqavatar`
  }

  public constructor(private readonly notifyService: NotifyService) {
    super()
    this.notifyService.setTitle()
  }

  public ngOnInit() {
    this.notifyService.updateHeaderContent({ title: '', subTitle: [] })
    this.load(
      forkJoin({
        posts: this.apiService.getPosts().pipe(
          map((data) =>
            data
              .filter(({ hide }) => !hide)
              .sort((a, b) => b.created - a.created)
              .slice(0, 4)
          )
        ),
        news: this.apiService.getNewses().pipe(map((data) => data.sort((a, b) => b.created - a.created).slice(0, 4))),
        videos: this.apiService.getVideos().pipe(map((data) => data.sort((a, b) => b.created - a.created).slice(0, 4))),
        projects: this.apiService.getProjects().pipe(map((data) => data.slice(0, 4))),
        music: this.apiService.getMusic()
      }),
      ({ music }) => {
        if (!this.browserService.isBrowser || music.length) return
        this.aplayer = new APlayer({
          container: document.getElementById('recent-music'),
          theme: 'var(--primary-100)',
          listMaxHeight: '320px',
          audio: music
        })
      }
    )
  }

  public ngOnDestroy() {
    this.aplayer?.destroy()
  }
}

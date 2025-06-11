import { CUSTOM_ELEMENTS_SCHEMA, Component, OnDestroy, OnInit } from '@angular/core'
import { BrowserService } from '../../services/browser.service'
import { NotifyService } from '../../services/notify.service'
import { APlayer } from '../../shared/types'
import { ApiService } from '../../services/api.service'
import { ResMusicData } from '../../models/api.model'
import { LoadingComponent } from '../../components/loading/loading.component'

@Component({
  selector: 'app-music',
  standalone: true,
  imports: [LoadingComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './music.component.html'
})
export class MusicComponent implements OnInit, OnDestroy {
  public isLoading = true

  protected aplayer?: APlayer

  private musicList?: ResMusicData[]

  private get musicCount() {
    return this.musicList?.length.toString() ?? '??'
  }

  public constructor(
    private readonly browserService: BrowserService,
    private readonly notifyService: NotifyService,
    private readonly apiService: ApiService
  ) {}

  public ngOnInit() {
    this.apiService.getMusic().subscribe((data) => {
      const isEmpty = !this.musicList
      this.musicList = data
      this.isLoading = false
      if (!this.browserService.isBrowser || !isEmpty || !this.aplayer) return
      this.aplayer.list.add(data)
    })

    this.notifyService.updateHeaderContent({
      title: '歌单列表',
      subTitle: [`共 ${this.musicCount} 首歌曲`, '内容从网易云歌单中同步']
    })
    if (this.browserService.isBrowser) this.initAplayer()
  }

  private initAplayer() {
    if (!this.browserService.isBrowser) return
    this.aplayer = new APlayer({
      container: document.getElementById('aplayer'),
      theme: 'var(--primary-100)',
      listMaxHeight: '70vh',
      lrcType: 1,
      audio: this.musicList ?? []
    })
  }

  public ngOnDestroy() {
    this.aplayer?.destroy()
  }
}

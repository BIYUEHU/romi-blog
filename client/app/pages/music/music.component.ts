import { CUSTOM_ELEMENTS_SCHEMA, Component, OnDestroy, OnInit } from '@angular/core'
import musicList from '../../shared/music.json'
import { BrowserService } from '../../services/browser.service'
import { NotifyService } from '../../services/notify.service'
import { APlayer } from '../../shared/types'

@Component({
  selector: 'app-music',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './music.component.html'
})
export class MusicComponent implements OnInit, OnDestroy {
  public isLoading = true
  protected aplayer?: APlayer

  public constructor(
    private readonly browserService: BrowserService,
    private readonly notifyService: NotifyService
  ) {}

  public ngOnInit() {
    this.notifyService.updateHeaderContent({
      title: '歌单列表',
      subTitle: [`共 ${musicList.length} 首歌曲`]
    })
    if (this.browserService.isBrowser) this.initAplayer()
  }

  private initAplayer() {
    this.aplayer = new APlayer({
      container: document.getElementById('aplayer'),
      theme: 'var(--primary-100)',
      listMaxHeight: '70vh',
      lrcType: 1,
      audio: musicList
    })
  }

  public ngOnDestroy() {
    this.aplayer?.destroy()
  }
}

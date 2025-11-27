import { Component, CUSTOM_ELEMENTS_SCHEMA, OnDestroy, OnInit } from '@angular/core'
import { LoadingComponent } from '../../components/loading/loading.component'
import { ResMusicData } from '../../models/api.model'
import { ApiService } from '../../services/api.service'
import { BrowserService } from '../../services/browser.service'
import { LayoutService } from '../../services/layout.service'
import { APlayer } from '../../shared/types'

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
    private readonly layoutService: LayoutService,
    private readonly browserService: BrowserService,
    private readonly apiService: ApiService
  ) {
    this.layoutService.setTitle('歌单收藏')
  }

  public ngOnInit() {
    this.browserService.on(() => {
      this.apiService.getMusic().subscribe((data) => {
        const isEmpty = !this.musicList
        this.musicList = data
        this.isLoading = false

        setTimeout(() => {
          this.aplayer = new APlayer({
            container: document.getElementById('aplayer'),
            theme: 'var(--primary-100)',
            listMaxHeight: '70vh',
            lrcType: 1,
            audio: this.musicList ?? []
          })

          if (isEmpty && this.aplayer) this.aplayer.list.add(data)
        }, 0)
      })

      this.layoutService.updateHeader({
        title: '歌单收藏',
        subTitle: [`共 ${this.musicCount} 首歌曲`, '内容从网易云歌单中同步']
      })
    })
  }

  public ngOnDestroy() {
    this.aplayer?.destroy()
  }
}

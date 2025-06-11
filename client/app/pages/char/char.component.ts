import { CUSTOM_ELEMENTS_SCHEMA, Component, OnDestroy, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { LoadingComponent } from '../../components/loading/loading.component'
import { romiComponentFactory } from '../../utils/romi-component-factory'
import { NotifyService } from '../../services/notify.service'
import { ResCharacterData, ResMusicData } from '../../models/api.model'
import { DatePipe } from '@angular/common'
import { CardComponent } from '../../components/card/card.component'
import { renderCharacterBWH } from '../../utils'
import { APlayer } from '../../shared/types'
import { BrowserService } from '../../services/browser.service'

@Component({
  selector: 'app-char',
  standalone: true,
  imports: [LoadingComponent, DatePipe, CardComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './char.component.html'
})
export class CharComponent extends romiComponentFactory<ResCharacterData>('char') implements OnInit, OnDestroy {
  public isLoading = true

  protected aplayer?: APlayer

  private musicList: ResMusicData[] = []

  private getMusic() {
    if (this.data && !this.data.id) return undefined
    if (!this.data || this.musicList.length === 0) return []
    const music = this.musicList.find((music) =>
      music.url.includes(`id=${(this.data as ResCharacterData).song_id}.mp3`)
    )
    return music ? [music] : undefined
  }

  public get BWH() {
    return this.data ? renderCharacterBWH(this.data) : ''
  }

  public constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly notifyService: NotifyService
  ) {
    super()
  }

  public ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'))
    if (Number.isNaN(id) || id <= 0) {
      this.router.navigate(['/404'])
      return
    }

    this.apiService.getMusic().subscribe((data) => {
      this.musicList = data
      if (!this.aplayer) return
      const music = this.getMusic()
      if (music === undefined) {
        this.aplayer.destroy()
        return
      }
      this.aplayer.list.add(music)
      if (music.length > 0) this.aplayer.play()
    })

    this.setData(
      (set) => this.apiService.getCharacter(id).subscribe((data) => set(data)),
      (data) => {
        this.isLoading = false
        this.notifyService.updateHeaderContent({
          title: data.name,
          subTitle: [data.romaji, data.description]
        })
        if (!this.browserService.isBrowser) return

        setTimeout(() => {
          const music = this.getMusic()
          if (music === undefined) return
          this.aplayer = new APlayer({
            container: document.getElementById('aplayer'),
            theme: 'var(--primary-100)',
            lrcType: 1,
            audio: music
          })
          if (music.length > 0) this.aplayer.play()
        }, 0)
      }
    )
  }

  public ngOnDestroy(): void {
    this.aplayer?.destroy()
  }
}

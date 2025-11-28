import { DatePipe, NgOptimizedImage } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnDestroy, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { CardComponent } from '../../components/card/card.component'
import { ResCharacterData } from '../../models/api.model'
import { LayoutService } from '../../services/layout.service'
import { APlayer } from '../../shared/types'
import { randomRTagType, renderCharacterBWH } from '../../utils'

@Component({
  selector: 'app-char',
  standalone: true,
  imports: [DatePipe, CardComponent, NgOptimizedImage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './char.component.html'
})
export class CharComponent implements OnInit, OnDestroy {
  @Input() public readonly char!: ResCharacterData

  public tags!: [string, string][]

  public currentImageIndex = 0

  protected aplayer?: APlayer

  // private musicList: ResMusicData[] = []
  //
  // private getMusic() {
  //   if (this.data && !this.data.id) return undefined
  //   if (!this.data || this.musicList.length === 0) return []
  //   const music = this.musicList.find((music) =>
  //     music.url.includes(`id=${(this.data as unknown as ResCharacterData).song_id}.mp3`)
  //   )
  //   return music ? [music] : undefined
  // }

  public get BWH() {
    return this.char ? renderCharacterBWH(this.char as unknown as ResCharacterData) : ''
  }

  get currentImageUrl(): string {
    if (this.char && this.char.images && this.char.images.length > this.currentImageIndex) {
      return this.char.images[this.currentImageIndex]
    }
    return ''
  }

  public constructor(
    private readonly router: Router,
    private readonly layoutService: LayoutService
  ) {}

  public ngOnInit() {
    // TODO: 获取音乐
    // this.apiService.getMusic().subscribe((data) => {
    //   this.musicList = data
    //   if (!this.aplayer) return
    //   const music = this.getMusic()
    //   if (music === undefined) {
    //     this.aplayer.destroy()
    //     return
    //   }
    //   this.aplayer.list.add(music)
    //   if (music.length > 0) this.aplayer.play()
    // })

    this.layoutService.updateHeader({
      title: this.char.name,
      subTitle: [this.char.romaji, this.char.description]
    })
    this.layoutService.setTitle(`${this.char.name} ${this.char.romaji}`)
    this.tags = this.char.tags.map((tag) => [tag, randomRTagType()])

    // if (!this.browserService.is) return
    // setTimeout(() => {
    //   const music = this.getMusic()
    //   if (music === undefined) return
    //   this.aplayer = new APlayer({
    //     container: document.getElementById('aplayer'),
    //     theme: 'var(--primary-100)',
    //     lrcType: 1,
    //     audio: music,
    //     ...(this.data?.color ? { theme: `#${this.data.color}` } : {})
    //   })
    //   if (music.length > 0) this.aplayer.play()
    // }, 0)
  }

  public nextImage(event: Event): void {
    event.preventDefault()
    if (this.char.images.length <= 1) return
    this.currentImageIndex = (this.currentImageIndex + 1) % this.char.images.length
  }

  public prevImage(event: Event): void {
    event.preventDefault()
    if (this.char.images.length <= 1) return
    const len = this.char.images.length
    this.currentImageIndex = (this.currentImageIndex - 1 + len) % len
  }

  public ngOnDestroy(): void {
    this.aplayer?.destroy()
  }
}

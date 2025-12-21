import { DatePipe, NgOptimizedImage } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core'
import { Router } from '@angular/router'
import { interval, Subscription } from 'rxjs'
import { CardComponent } from '../../components/card/card.component'
import { ResCharacterData, ResMusicData } from '../../models/api.model'
import { ApiService } from '../../services/api.service'
import { BrowserService } from '../../services/browser.service'
import { NotifyService } from '../../services/notify.service'
import { APlayer } from '../../shared/types'
import { randomRTagType, renderCharacterBWH } from '../../utils'

@Component({
  selector: 'app-char',
  imports: [DatePipe, CardComponent, NgOptimizedImage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './char.component.html'
})
export class CharComponent implements OnInit, OnChanges, OnDestroy {
  private static readonly CAROUSEL_INTERVAL_MS = 7000

  @Input() public readonly char!: ResCharacterData

  private carouselSubscription: Subscription | null = null

  public tags!: [string, string][]

  public currentImageIndex = 0

  protected aplayer?: APlayer

  private getMusic(musicList: ResMusicData[]) {
    if (musicList.length === 0) return []
    const music = musicList.find((music) => music.url.includes(`id=${this.char.song_id}.mp3`))
    return music ? [music] : null
  }

  public get BWH() {
    return this.char ? renderCharacterBWH(this.char as unknown as ResCharacterData) : ''
  }

  public get currentImageUrl() {
    return this.char.images.length > this.currentImageIndex ? this.char.images[this.currentImageIndex] : ''
  }

  private clearCarousel() {
    if (this.carouselSubscription) {
      this.carouselSubscription.unsubscribe()
      this.carouselSubscription = null
    }
  }

  private setupCarousel() {
    if (!this.browserService.is) return
    this.clearCarousel()

    if (this.char.images.length <= 1) return
    this.currentImageIndex = 0
    this.carouselSubscription = interval(CharComponent.CAROUSEL_INTERVAL_MS).subscribe(() => this.nextImage())
  }

  public constructor(
    private readonly router: Router,
    private readonly notifyService: NotifyService,
    private readonly apiService: ApiService,
    private readonly browserService: BrowserService
  ) {}

  public ngOnInit() {
    this.browserService.on(() => {
      this.apiService.getMusic().subscribe((data) => {
        const audio = this.getMusic(data)
        if (!audio) {
          this.aplayer?.destroy()
          return
        }
        setTimeout(() => {
          this.aplayer = new APlayer({
            container: document.getElementById('aplayer'),
            theme: 'var(--primary-100)',
            lrcType: 1,
            audio,
            ...(this.char?.color ? { theme: `#${this.char.color}` } : {})
          })
          if (audio.length > 0) this.aplayer.play()
        }, 0)
      })
    })

    this.tags = this.char.tags.map((tag) => [tag, randomRTagType()])

    this.setupCarousel()
  }

  public async shareCharacter() {
    const copyText = `${this.char.name} (${this.char.romaji}) - ${location.origin}${this.router.url}`
    try {
      await navigator.clipboard.writeText(copyText)
      this.notifyService.showMessage('链接已复制到剪贴板', 'success')
    } catch (_) {
      this.notifyService.showMessage('链接复制失败', 'error')
    }
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes['char']) this.setupCarousel()
  }

  public prevImage(event?: Event): void {
    if (event) event.preventDefault()
    if (this.char.images.length <= 1) return
    const len = this.char.images.length
    this.currentImageIndex = (this.currentImageIndex - 1 + len) % len
  }

  public nextImage(event?: Event): void {
    if (event) event.preventDefault()
    if (this.char.images.length <= 1) return
    const len = this.char.images.length
    this.currentImageIndex = (this.currentImageIndex + 1 + len) % len
  }

  public ngOnDestroy(): void {
    this.aplayer?.destroy()
    this.clearCarousel()
  }
}

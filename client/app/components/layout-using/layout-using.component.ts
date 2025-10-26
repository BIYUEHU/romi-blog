import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnDestroy, OnInit } from '@angular/core'
import { NavigationStart, Router, RouterLink } from '@angular/router'
import { BrowserService } from '../../services/browser.service'
import { NotifyService } from '../../services/notify.service'
import { FooterComponent } from '../footer/footer.component'
import { HeaderComponent } from '../header/header.component'
import '../../shared/types'
import { ResMusicData } from '../../models/api.model'
import { ApiService } from '../../services/api.service'
import { KEYS } from '../../services/store.service'
import { APlayer } from '../../shared/types'

@Component({
  selector: 'app-layout-using',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './layout-using.component.html'
})
export class LayoutUsingComponent implements OnInit, OnDestroy {
  private initHeaderData = {
    title: 'Arimura Sena',
    subTitle: ['What is mind? No matter.', 'What is matter? Never mind.'],
    imageUrl: 'https://api.hotaru.icu/ial/background?id=2'
  }

  public showBackTop = false

  @Input() public imageHeight = ''

  public headerImageHeight = 'h-350px'

  public headerData: Partial<typeof this.initHeaderData> = this.initHeaderData

  @Input()
  public fullBackground = false

  @Input()
  public displayFooter = true

  protected aplayer?: APlayer

  protected aplayerTimer?: number

  private musicList?: ResMusicData[]

  public constructor(
    private readonly router: Router,
    private readonly notifyService: NotifyService,
    private readonly browserService: BrowserService,
    private readonly apiService: ApiService
  ) {}

  public ngOnInit() {
    this.headerImageHeight = this.imageHeight ? this.imageHeight : this.fullBackground ? 'min-h-screen' : 'h-350px'

    this.apiService.getMusic().subscribe((data) => {
      const isEmpty = !this.musicList
      this.musicList = data
      if (!this.browserService.isBrowser || !isEmpty) return
      this.aplayer?.list.add(data)
    })

    this.notifyService.headerUpdated$.subscribe((data) => this.updateHeaderContent(data))
    this.router.events.subscribe((event) => this.handleRouteEvent(event))
    if (!this.browserService.isBrowser) return

    window.addEventListener('scroll', () => {
      this.showBackTop = window.scrollY > 100
    })
    this.togglePlayer(true)
  }

  private updateHeaderContent(data: Partial<typeof this.initHeaderData>) {
    this.headerData = {
      ...this.initHeaderData,
      ...data
    }
    if (this.imageHeight || this.fullBackground) return
    this.headerImageHeight = `h-${
      (this.headerData.title?.length ??
        0 + (this.headerData.subTitle?.reduce((acc, cur) => acc + cur.length, 0) ?? 0)) * 160
    }px`
  }

  private handleRouteEvent(event: object) {
    if (event instanceof NavigationStart) {
      this.updateHeaderContent({})
    }
  }

  public scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  public togglePlayer(isFirst: boolean) {
    if (this.router.url === '/music') return
    const playerDisabled = this.browserService.store!.getItem(KEYS.APLAYER_DISABLED) === 'true'
    if (isFirst && playerDisabled) return

    if (this.aplayer) {
      this.browserService.store!.setItem(KEYS.APLAYER_DISABLED, 'true')
      this.aplayer.destroy()
      this.aplayer = undefined
      return
    }

    const aliveTime = Number(this.browserService.store!.getItem(KEYS.APLAYER_ALIVE_TIME) ?? 0)
    if (!Number.isNaN(aliveTime) && Date.now() - aliveTime < 1010) return

    this.browserService.store!.setItem(KEYS.APLAYER_DISABLED, 'false')
    this.aplayer = new APlayer({
      container: document.getElementById('aplayer-global'),
      autoplay: true,
      fixed: true,
      lrcType: 1,
      order: 'random',
      theme: 'var(--primary-100)',
      audio: this.musicList
    })
    this.aplayer
    if (this.aplayerTimer) return

    this.aplayerTimer = Number(
      setInterval(() => {
        if (this.aplayer) this.browserService.store!.setItem(KEYS.APLAYER_ALIVE_TIME, Date.now().toString())
      }, 1000)
    )
  }

  public ngOnDestroy() {
    this.aplayer?.destroy()
  }
}

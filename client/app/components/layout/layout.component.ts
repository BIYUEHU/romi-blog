import { NgOptimizedImage } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnDestroy, OnInit } from '@angular/core'
import { NavigationEnd, NavigationStart, Router, RouterLink } from '@angular/router'
import { ResMusicData } from '../../models/api.model'
import { BrowserService } from '../../services/browser.service'
import { LayoutService } from '../../services/layout.service'
import { KEYS, StoreService } from '../../services/store.service'
import { APlayer } from '../../shared/types'
import { FooterComponent } from '../footer/footer.component'
import { HeaderComponent } from '../header/header.component'

@Component({
    selector: 'app-layout',
    imports: [HeaderComponent, FooterComponent, RouterLink, NgOptimizedImage],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './layout.component.html'
})
export class LayoutComponent implements OnInit, OnDestroy {
  private static SCROLL_OFFSET_HEIGHT_PX = -88

  @Input() public imageHeight = ''
  @Input() public fullBackground = false
  @Input() public disabledFooter = false

  private musicList?: ResMusicData[]

  protected aplayer?: APlayer
  protected aplayerTimer?: number

  public showBackTop = false
  public isLoading = false

  public constructor(
    private readonly router: Router,
    private readonly storeService: StoreService,
    private readonly browserService: BrowserService,
    public readonly layoutService: LayoutService
  ) {}

  public get headerImageHeight() {
    return this.imageHeight ? this.imageHeight : this.fullBackground ? 'min-h-screen' : 'h-350px'
  }

  public ngOnInit() {
    this.router.events.subscribe((event) => this.handleRouteEvent(event))

    this.browserService.on(() => {
      window.addEventListener('scroll', () => {
        this.showBackTop = window.scrollY > 100
      })
      this.togglePlayer(true)
    })
  }

  private handleRouteEvent(event: object) {
    if (event instanceof NavigationStart) {
      this.isLoading = true
    } else if (event instanceof NavigationEnd) {
      this.isLoading = false
      const { fragment } = this.router.parseUrl(this.router.url)
      if (!fragment) return
      const el = document.getElementById(fragment)
      if (!el) return
      setTimeout(() => {
        window.scrollTo({
          top: el.getBoundingClientRect().top + window.scrollY + LayoutComponent.SCROLL_OFFSET_HEIGHT_PX,
          behavior: 'smooth'
        })
      }, 100)
    }
  }

  public scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  public togglePlayer(isFirst: boolean) {
    if (this.router.url === '/music' || (isFirst && this.storeService.getItem(KEYS.APLAYER_DISABLED) === 'true')) {
      return
    }

    if (this.aplayer) {
      this.storeService.setItem(KEYS.APLAYER_DISABLED, 'true')
      this.aplayer.destroy()
      this.aplayer = undefined
      return
    }

    const aliveTime = Number(this.storeService.getItem(KEYS.APLAYER_ALIVE_TIME) ?? 0)
    if (!Number.isNaN(aliveTime) && Date.now() - aliveTime < 1010) return

    this.storeService.setItem(KEYS.APLAYER_DISABLED, 'false')
    this.aplayer = new APlayer({
      container: document.getElementById('aplayer-global'),
      autoplay: true,
      fixed: true,
      lrcType: 1,
      order: 'random',
      theme: 'var(--primary-100)',
      audio: this.musicList
    })

    if (!this.aplayerTimer) {
      this.aplayerTimer = Number(
        setInterval(() => {
          if (this.aplayer) this.storeService.setItem(KEYS.APLAYER_ALIVE_TIME, Date.now().toString())
        }, 1000)
      )
    }
  }

  public ngOnDestroy() {
    this.aplayer?.destroy()
  }
}

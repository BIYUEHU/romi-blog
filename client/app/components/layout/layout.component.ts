import { NgOptimizedImage, ViewportScroller } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA, HostListener, Input, OnDestroy, OnInit } from '@angular/core'
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterLink } from '@angular/router'
import { ResMusicData } from '../../models/api.model'
import { ApiService } from '../../services/api.service'
import { BrowserService } from '../../services/browser.service'
import { LayoutService } from '../../services/layout.service'
import { STORE_KEYS, StoreService } from '../../services/store.service'
import { APlayer } from '../../shared/types'
import { FooterComponent } from '../footer/footer.component'
import { HeaderComponent } from '../header/header.component'
import { SkeletonLoaderComponent } from '../skeleton-loader/skeleton-loader.component'

@Component({
  selector: 'app-layout',
  imports: [HeaderComponent, FooterComponent, RouterLink, NgOptimizedImage, SkeletonLoaderComponent],
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
  public isError = false

  public constructor(
    private readonly router: Router,
    private readonly viewportScroller: ViewportScroller,
    private readonly storeService: StoreService,
    public readonly layoutService: LayoutService,
    browserService: BrowserService,
    apiService: ApiService
  ) {
    browserService.on(() =>
      apiService.getMusic().subscribe((data) => {
        this.musicList = data
        setTimeout(() => {
          this.togglePlayer(true)
        }, 1000)
      })
    )
  }

  public get headerImageHeight() {
    return this.imageHeight ? this.imageHeight : this.fullBackground ? 'min-h-screen' : 'h-350px'
  }

  public ngOnInit() {
    this.router.events.subscribe((event) => this.handleRouteEvent(event))
  }

  @HostListener('window:scroll')
  public onScroll() {
    this.showBackTop = window.scrollY > 100
  }

  private handleRouteEvent(event: object) {
    if (event instanceof NavigationStart) {
      if (!(this.router.url.split('#')[0] === event.url?.split('#')[0])) {
        this.isLoading = true
        this.viewportScroller.scrollToPosition([0, 0])
      }
    } else if (event instanceof NavigationEnd) {
      this.isLoading = false

      this.layoutService.updateHeader({
        ...this.layoutService.header$(),
        imageUrl: LayoutService.DEFAULT_HEADER.imageUrl
      })

      const { fragment } = this.router.parseUrl(this.router.url)
      if (fragment) {
        setTimeout(() => {
          const el = document.getElementById(fragment)
          if (!el) return
          const top = el.getBoundingClientRect().top + window.scrollY + LayoutComponent.SCROLL_OFFSET_HEIGHT_PX
          window.scrollTo({
            top: top,
            behavior: 'smooth'
          })
        }, 100)
      } else {
        this.viewportScroller.scrollToPosition([0, 0])
      }
    } else if (event instanceof NavigationCancel || event instanceof NavigationError) {
      this.isLoading = false
      if (event instanceof NavigationError) this.isError = true
    }
  }

  public scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  public togglePlayer(isFirst: boolean) {
    if (
      this.router.url === '/music' ||
      (isFirst && this.storeService.getItem(STORE_KEYS.APLAYER_DISABLED) === 'true')
    ) {
      return
    }

    if (this.aplayer) {
      this.storeService.setItem(STORE_KEYS.APLAYER_DISABLED, 'true')
      this.aplayer.destroy()
      this.aplayer = undefined
      return
    }

    this.storeService.setItem(STORE_KEYS.APLAYER_DISABLED, 'false')
    this.aplayer = new APlayer({
      container: document.getElementById('aplayer-global'),
      fixed: true,
      autoplay: true,
      lrcType: 1,
      order: 'random',
      theme: 'var(--primary-100)',
      audio: this.musicList
    })
  }

  public ngOnDestroy() {
    this.aplayer?.destroy()
  }
}

import { NgOptimizedImage, ViewportScroller } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA, HostListener, Input, OnInit } from '@angular/core'
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterLink } from '@angular/router'
import { ServerErrorComponent } from '../../pages/server-error/server-error.component'
import { BrowserService } from '../../services/browser.service'
import { PlayerService } from '../../services/player.service'
import { ThemeMode, ThemeService } from '../../services/theme.service'
import { AppTitleStrategy } from '../../shared/title-strategy'
import { ErrorPageComponent } from '../error-page/error-page.component'
import { FooterComponent } from '../footer/footer.component'
import { HeaderComponent } from '../header/header.component'
import { SkeletonLoaderComponent } from '../skeleton-loader/skeleton-loader.component'

@Component({
  selector: 'app-layout',
  imports: [
    HeaderComponent,
    FooterComponent,
    RouterLink,
    NgOptimizedImage,
    SkeletonLoaderComponent,
    ErrorPageComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './layout.component.html'
})
export class LayoutComponent implements OnInit {
  private static SCROLL_OFFSET_HEIGHT_PX = -88

  @Input() public imageHeight = ''
  @Input() public fullBackground = false
  @Input() public disabledFooter = false

  public showBackTop = false
  public isLoading = false
  public isError = false

  public themeLayerVisible = false

  public constructor(
    private readonly router: Router,
    private readonly viewportScroller: ViewportScroller,
    public readonly themeService: ThemeService,
    private readonly playerService: PlayerService,
    public readonly appTitleStrategy: AppTitleStrategy,
    private readonly browserService: BrowserService
  ) {}

  public get headerImageHeight() {
    return this.imageHeight ? this.imageHeight : this.fullBackground ? 'min-h-screen' : 'h-350px'
  }

  public get playerIsDisabled() {
    return this.playerService.disabled
  }

  public ngOnInit() {
    this.router.events.subscribe((event) => this.handleRouteEvent(event))
    this.browserService.on(() => setTimeout(() => this.togglePlayer(true), 1000))
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

      // this.appTitleStrategy.updateHeader({
      //   ...this.appTitleStrategy.header$(),
      //   imageUrl: AppTitleStrategy.DEFAULT_HEADER.imageUrl
      // })

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
    if (isFirst) this.playerService.init(document.getElementById('player-global')!)
    else this.playerService.toggle()
  }

  public notify() {
    ServerErrorComponent.prototype.notify()
  }

  public reload() {
    window.location.reload()
  }

  public toggleThemeLayer() {
    this.themeLayerVisible = !this.themeLayerVisible
  }

  public selectTheme(theme: ThemeMode) {
    this.themeService.applyTheme(theme)
    this.reload()
  }

  public selectColor(color: string) {
    this.themeService.applyColor(color)
    this.reload()
  }
}

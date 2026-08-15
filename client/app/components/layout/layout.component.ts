import { NgOptimizedImage, ViewportScroller } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA, HostListener, Input, OnDestroy, OnInit } from '@angular/core'
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterLink } from '@angular/router'
import { ResMusicData } from '../../models/api.model'
import { ServerErrorComponent } from '../../pages/server-error/server-error.component'
import { ApiService } from '../../services/api.service'
import { BrowserService } from '../../services/browser.service'
import { STORE_KEYS, StoreService } from '../../services/store.service'
import { AppTitleStrategy } from '../../shared/title-strategy'
import { APlayer } from '../../shared/types'
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
export class LayoutComponent implements OnInit, OnDestroy {
  private static SCROLL_OFFSET_HEIGHT_PX = -88

  @Input() public imageHeight = ''
  @Input() public fullBackground = false
  @Input() public disabledFooter = false

  private musicList?: ResMusicData[]

  protected aplayer?: APlayer

  public showBackTop = false
  public isLoading = false
  public isError = false

  public themeLayerVisible = false
  public readonly themes = [
    { value: 'light' as const, label: '浅色' },
    { value: 'dark' as const, label: '深色' },
    { value: 'system' as const, label: '跟随系统' }
  ] as const
  public readonly colors = [
    { name: '粉色', brand: '#d87cb6', accent: '#9573a2' },
    { name: '紫色', brand: '#9573a2', accent: '#7b5ea7' },
    { name: '蓝色', brand: '#5b8dee', accent: '#3a6fd8' },
    { name: '绿色', brand: '#4caf7d', accent: '#3a9d6e' },
    { name: '橙色', brand: '#f0a04b', accent: '#e08a3c' }
  ] as const
  public selectedTheme: 'light' | 'dark' | 'system' = 'light'
  public selectedColor = '粉色'

  public constructor(
    private readonly router: Router,
    private readonly viewportScroller: ViewportScroller,
    private readonly storeService: StoreService,
    public readonly appTitleStrategy: AppTitleStrategy,
    private readonly browserService: BrowserService,
    private readonly apiService: ApiService
  ) {
    this.browserService.on(() =>
      this.apiService.getMusic().subscribe((data) => {
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
    this.initTheme()
  }

  private initTheme() {
    const theme = this.storeService.getItem(STORE_KEYS.THEME)
    const color = this.storeService.getItem(STORE_KEYS.COLOR)
    if (theme) this.selectTheme(theme as 'light' | 'dark' | 'system')
    if (color) this.selectColor(color)
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
    if (
      this.router.url === '/music' ||
      (isFirst && this.storeService.getItem(STORE_KEYS.APLAYER_DISABLED) === 'true')
    ) {
      return
    }

    if (this.aplayer) {
      this.storeService.setItem(STORE_KEYS.APLAYER_DISABLED, 'true')
      this.aplayer.destroy()
      this.aplayer = void 0
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

  public notify() {
    ServerErrorComponent.prototype.notify()
  }

  public reload() {
    window.location.reload()
  }

  public toggleThemeLayer() {
    this.themeLayerVisible = !this.themeLayerVisible
  }

  public selectTheme(theme: 'light' | 'dark' | 'system') {
    this.selectedTheme = theme
    this.storeService.setItem(STORE_KEYS.THEME, theme)
    document.documentElement.toggleAttribute('data-dark', this.isDarkTheme(theme))
  }

  private isDarkTheme(theme: 'light' | 'dark' | 'system'): boolean {
    if (theme === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches
    return theme === 'dark'
  }

  public selectColor(color: string) {
    this.selectedColor = color
    this.storeService.setItem(STORE_KEYS.COLOR, color)
    const preset = this.colors.find((item) => item.name === color)
    if (!preset) return
    document.documentElement.style.setProperty('--brand-base', preset.brand)
    document.documentElement.style.setProperty('--accent-base', preset.accent)
  }

  public ngOnDestroy() {
    this.aplayer?.destroy()
  }
}

import { Injectable } from '@angular/core'
import { THEME_COLORS } from '../shared/constants'
import { BrowserService } from './browser.service'
import { STORE_KEYS, StoreService } from './store.service'

export type ThemeMode = 'light' | 'dark' | 'auto'

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  public readonly themes = [
    { value: 'light', label: '浅色' },
    { value: 'dark', label: '深色' },
    { value: 'auto', label: '跟随系统' }
  ] as const

  public readonly colors = THEME_COLORS

  public selectedTheme: ThemeMode = 'auto'
  public selectedColor: string = this.colors[0].name

  public constructor(
    private readonly storeService: StoreService,
    private readonly browserService: BrowserService
  ) {}

  public init() {
    if (!this.browserService.is) return
    const theme = this.storeService.getItem(STORE_KEYS.THEME)
    const color = this.storeService.getItem(STORE_KEYS.COLOR)
    this.applyTheme(theme ? (theme as ThemeMode) : 'auto')
    if (color) this.applyColor(color)
  }

  public applyTheme(theme: ThemeMode) {
    this.selectedTheme = theme
    if (!this.browserService.is) return
    this.storeService.setItem(STORE_KEYS.THEME, theme)
    const dark = this.isDark(theme)
    document.documentElement.toggleAttribute('data-dark', dark)
    document.documentElement.classList.toggle('dark', dark)
  }

  public applyColor(color: string) {
    this.selectedColor = color
    if (!this.browserService.is) return
    this.storeService.setItem(STORE_KEYS.COLOR, color)
    const preset = this.colors.find((item) => item.name === color)
    if (!preset) return
    document.documentElement.style.setProperty('--brand-base', preset.brand)
    document.documentElement.style.setProperty('--accent-base', preset.accent)
  }

  private isDark(theme: ThemeMode): boolean {
    if (theme === 'auto') return window.matchMedia('(prefers-color-scheme: dark)').matches
    return theme === 'dark'
  }
}

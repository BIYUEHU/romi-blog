import { Injectable } from '@angular/core'
import { BrowserService } from './browser.service'
import { STORE_KEYS, StoreService } from './store.service'

type ThemeMode = 'light' | 'dark' | 'system'

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
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

  public selectedTheme: ThemeMode = 'light'
  public selectedColor = '粉色'

  public constructor(
    private readonly storeService: StoreService,
    private readonly browserService: BrowserService
  ) {}

  public init() {
    const theme = this.storeService.getItem(STORE_KEYS.THEME)
    const color = this.storeService.getItem(STORE_KEYS.COLOR)
    if (theme) this.applyTheme(theme as ThemeMode)
    if (color) this.applyColor(color)
  }

  public applyTheme(theme: ThemeMode) {
    this.selectedTheme = theme
    this.storeService.setItem(STORE_KEYS.THEME, theme)
    const dark = this.isDark(theme)
    document.documentElement.toggleAttribute('data-dark', dark)
    document.documentElement.classList.toggle('dark', dark)
  }

  public applyColor(color: string) {
    this.selectedColor = color
    this.storeService.setItem(STORE_KEYS.COLOR, color)
    const preset = this.colors.find((item) => item.name === color)
    if (!preset) return
    document.documentElement.style.setProperty('--brand-base', preset.brand)
    document.documentElement.style.setProperty('--accent-base', preset.accent)
  }

  private isDark(theme: ThemeMode): boolean {
    if (theme === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches
    return theme === 'dark'
  }
}

import { Component, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import type { ResSearchResultItem } from '../../models/api.model'
import { ApiService } from '../../services/api.service'

@Component({
  selector: 'app-header',
  imports: [RouterLink, FormsModule],
  templateUrl: './header.component.html'
})
export class HeaderComponent {
  public isMenuOpen = false
  public isSearchOpen = signal(false)
  public searchQuery = ''
  public searchResults = signal<ResSearchResultItem[]>([])
  public searchLoading = signal(false)
  private searchTimer: ReturnType<typeof setTimeout> | null = null

  public navItems = [
    { text: '首页', link: '/' },
    {
      text: '笔记',
      children: [
        { text: '文章', link: '/post' },
        { text: '归档', link: '/archive' },
        { text: '动态', link: '/news' },
        { text: '语录', link: '/hitokotos' }
      ]
    },
    {
      text: '兴趣',
      children: [
        { text: '歌单', link: '/music' },
        { text: '追番', link: '/anime' },
        { text: 'GAL', link: '/gal' },
        { text: '角色', link: '/char' }
      ]
    },
    { text: '关于', link: '/about' },
    { text: '友链', link: '/links' },
    { text: '项目', link: '/project' },
    { text: '日志', link: '/log' }
  ]

  public constructor(public readonly apiService: ApiService) {}

  public toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen
    if (this.isMenuOpen) {
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = `${scrollBarWidth}px`
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }

  public toggleSearch() {
    this.isSearchOpen.update((v) => !v)
    if (!this.isSearchOpen()) {
      this.searchResults.set([])
      this.searchQuery = ''
    } else {
      this.searchQuery = ''
      this.searchResults.set([])
    }
  }

  public onSearchInput() {
    if (this.searchTimer) clearTimeout(this.searchTimer)
    this.searchTimer = setTimeout(() => {
      const q = this.searchQuery.trim()
      if (!q) {
        this.searchResults.set([])
        this.searchLoading.set(false)
        return
      }
      this.searchLoading.set(true)
      this.apiService.search(q).subscribe({
        next: (res) => {
          this.searchResults.set(res)
          this.searchLoading.set(false)
        },
        error: () => {
          this.searchResults.set([])
          this.searchLoading.set(false)
        }
      })
    }, 300)
  }
}

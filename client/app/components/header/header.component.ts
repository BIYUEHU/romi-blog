import { Component, OnDestroy, OnInit, SimpleChanges } from '@angular/core'
import { RouterLink } from '@angular/router'

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './header.component.html'
})
export class HeaderComponent {
  private lastSwitchMenu = 0

  public navItems = [
    { text: '首页', link: '/' },
    {
      text: '笔记',
      children: [
        { text: '文章', link: '/posts' },
        { text: '归档', link: '/archive' },
        { text: '动态', link: '/dynamics' },
        { text: '语录', link: '/quotes' }
      ]
    },
    {
      text: '兴趣',
      children: [
        { text: '歌单', link: '/music' },
        { text: '追番', link: '/anime' },
        { text: 'GAL', link: '/gal' },
        { text: '角色', link: 'https://m.hotaru.icu' }
        // { text: '角色', link: '/characters' }
      ]
    },
    { text: '关于', link: '/about' },
    { text: '友链', link: '/links' },
    { text: '日志', link: '/log' }
  ]

  public isMenuOpen = false

  public toggleMenu() {
    if (Date.now() - this.lastSwitchMenu < 200) return
    this.lastSwitchMenu = Date.now()
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
}

import { NgOptimizedImage } from '@angular/common'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, NgOptimizedImage],
  templateUrl: './header.component.html'
})
export class HeaderComponent {
  private lastSwitchMenu = 0

  public isMenuOpen = false

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

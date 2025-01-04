import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './header.component.html'
})
export class HeaderComponent {
  public navItems = [
    { text: '首页', link: '/' },
    { text: '归档', link: '/posts' },
    { text: '友链', link: '/friends' },
    { text: '日志', link: '/log' },
    { text: '关于', link: '/about' },
    { text: '分类', link: '/categories' },
    { text: '更多', link: '/more' }
  ]

  public screenWidth = window.innerWidth

  public isMenuOpen = false

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
}

import { Component, OnInit } from '@angular/core'
import { RouterLink } from '@angular/router'

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './header.component.html'
})
export class HeaderComponent {
  navItems = [
    { name: '首页', link: '/' },
    { name: '归档', link: '/archives' },
    { name: '友链', link: '/friends' },
    { name: '关于', link: '/about' }
  ]
}

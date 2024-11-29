import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './header.component.html'
})
export class HeaderComponent {
  navItems = [
    { text: '首页', link: '/' },
    { text: '归档', link: '/posts' },
    { text: '友链', link: '/friends' },
    { text: '日志', link: '/log' },
    { text: '关于', link: '/about' },
    { text: '项目', link: '/project' },
    { text: '分类', link: '/categories' },
    { text: '更多', link: '/more' },
    { text: '相关', link: '/related' }
  ]
}

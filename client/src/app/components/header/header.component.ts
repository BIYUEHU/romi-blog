import { Component, OnInit } from '@angular/core'
import { RouterLink } from '@angular/router'

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="fixed top-0 w-full bg-opacity-90 bg-gray-900 z-50">
      <nav class="container mx-auto px-4 py-3 flex justify-between items-center">
        <a routerLink="/" class="text-xl font-bold text-white">Hotaru Blog</a>
        <div class="flex space-x-4">
          <a *ngFor="let item of navItems"
             [routerLink]="item.link"
             class="text-gray-300 hover:text-white">
            {{item.name}}
          </a>
        </div>
      </nav>
    </header>
  `
})
export class HeaderComponent {
  navItems = [
    { name: '首页', link: '/' },
    { name: '归档', link: '/archives' },
    { name: '友链', link: '/friends' },
    { name: '关于', link: '/about' }
  ]
}

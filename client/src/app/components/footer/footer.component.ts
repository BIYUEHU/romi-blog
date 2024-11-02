import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="bg-gray-800 py-6 mt-12">
      <div class="container mx-auto px-4">
        <div class="text-center text-gray-400">
          <p>© 2019 - {{currentYear}} Hotaru Blog</p>
          <p class="mt-2">Made with ❤️ by Arimura Sena</p>
          <div class="mt-4 flex justify-center space-x-4">
            <a href="/rss" class="hover:text-white">RSS</a>
            <a href="/sitemap" class="hover:text-white">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  `
})
export class FooterComponent {
  currentYear = new Date().getFullYear()
}

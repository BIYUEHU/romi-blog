import { Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { HeaderComponent } from './components/header/header.component'
import { FooterComponent } from './components/footer/footer.component'
import { CommonModule } from '@angular/common'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, CommonModule],
  template: `
    <div class="min-h-screen bg-gray-900 text-white">
      <app-header />
      <main class="pt-16">
        <router-outlet></router-outlet>
      </main>
      <app-footer />
    </div>
  `,
  styles: [
    `
    :host {
      display: block;
      min-height: 100vh;
    }
  `
  ]
})
export class AppComponent {
  title = 'Hotaru Blog'
}

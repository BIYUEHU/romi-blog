import { Component } from '@angular/core'
import { NavigationEnd, Router, RouterOutlet } from '@angular/router'
import { MessageComponent } from './components/message/message.component'
import { ProgressComponent } from './components/progress/progress.component'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ProgressComponent, ProgressComponent, MessageComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  public constructor(private router: Router) {
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) {
        const tree = this.router.parseUrl(this.router.url)
        if (tree.fragment) {
          const el = document.getElementById(tree.fragment)
          if (el) el.scrollIntoView({ behavior: 'smooth' })
        }
      }
    })
  }
}

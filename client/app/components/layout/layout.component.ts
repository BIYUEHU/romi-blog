import { Component } from '@angular/core'
import { Router, RouterOutlet } from '@angular/router'
import { HomeComponent } from '../../pages/home/home.component'
import { LayoutUsingComponent } from '../layout-using/layout-using.component'

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, LayoutUsingComponent, HomeComponent],
  templateUrl: './layout.component.html'
})
export class LayoutComponent {
  public isHomePage!: boolean

  public constructor(private readonly router: Router) {
    this.update()
    this.router.events.subscribe(() => this.update())
  }

  public update() {
    this.isHomePage = this.router.url === '/'
  }
}

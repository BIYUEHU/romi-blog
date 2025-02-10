import { Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { LayoutUsingComponent } from '../layout-using/layout-using.component'

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, LayoutUsingComponent],
  templateUrl: './layout.component.html'
})
export class LayoutComponent {}

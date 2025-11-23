import { Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { LayoutComponent } from '../layout/layout.component'

@Component({
  selector: 'app-layout-wrapper',
  standalone: true,
  imports: [LayoutComponent, RouterOutlet],
  templateUrl: './layout-wrapper.component.html'
})
export class LayoutWrapperComponent {}

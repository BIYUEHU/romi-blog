import { Component, OnInit } from '@angular/core'
import {} from '@angular/common'
import { RouterOutlet } from '@angular/router'
import { ProgressComponent } from './components/progress/progress.component'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ProgressComponent, ProgressComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {}

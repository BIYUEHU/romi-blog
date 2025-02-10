import { Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { ProgressComponent } from './components/progress/progress.component'
import { MessageComponent } from './components/message/message.component'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ProgressComponent, ProgressComponent, MessageComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {}

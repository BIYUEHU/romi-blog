import { Component, OnInit } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { MessageComponent } from './components/message/message.component'
import { ProgressComponent } from './components/progress/progress.component'
import { ThemeService } from './services/theme.service'

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ProgressComponent, ProgressComponent, MessageComponent],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  public constructor(private readonly themeService: ThemeService) {}

  public ngOnInit() {
    this.themeService.init()
  }
}

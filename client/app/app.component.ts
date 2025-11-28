import { Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { MessageComponent } from './components/message/message.component'
import { ProgressComponent } from './components/progress/progress.component'

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, ProgressComponent, ProgressComponent, MessageComponent],
    templateUrl: './app.component.html'
})
export class AppComponent {}

import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { BrowserService } from '../../services/browser.service'
import { NotifyService } from '../../services/notify.service'

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './not-found.component.html'
})
export class NotFoundComponent {
  public constructor(
    private readonly notifyService: NotifyService,
    private readonly browserService: BrowserService
  ) {
    this.notifyService.setTitle(
      `${this.browserService.isBrowser && this.browserService.windowRef!.innerWidth >= 768 ? '电脑' : '手机'}哥给我干哪去了啊？？`
    )
  }

  public goBack(): void {
    window.history.back()
  }
}

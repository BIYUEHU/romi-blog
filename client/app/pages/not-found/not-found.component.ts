import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterLink } from '@angular/router'
import { BrowserService } from '../../services/browser.service'
import { LayoutService } from '../../services/layout.service'

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './not-found.component.html'
})
export class NotFoundComponent {
  public constructor(
    private readonly layoutService: LayoutService,
    private readonly browserService: BrowserService
  ) {
    this.layoutService.setTitle(
      `${this.browserService.isBrowser && this.browserService.windowRef!.innerWidth >= 768 ? '电脑' : '手机'}哥给我干哪去了啊？？`
    )
  }

  public goBack() {
    window.history.back()
  }

  public seekSena(url: 'https://himeno-sena.com') {
    window.open(url, '_blank')
  }
}

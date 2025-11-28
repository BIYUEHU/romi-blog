import { NgOptimizedImage } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterLink } from '@angular/router'
import { BrowserService } from '../../services/browser.service'
import { LayoutService } from '../../services/layout.service'

@Component({
    selector: 'app-not-found',
    imports: [RouterLink, NgOptimizedImage],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './not-found.component.html'
})
export class NotFoundComponent {
  public constructor(layoutService: LayoutService, browserService: BrowserService) {
    browserService.on(() => layoutService.setTitle(`${innerWidth >= 768 ? '电脑' : '手机'}哥给我干哪去了啊？？`))
  }

  public goBack() {
    window.history.back()
  }

  public seekSena(url: 'https://himeno-sena.com') {
    window.open(url, '_blank')
  }
}

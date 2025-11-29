import { NgOptimizedImage } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { ErrorPageComponent } from '../../components/error-page/error-page.component'
import { LayoutService } from '../../services/layout.service'

@Component({
  selector: 'app-forbidden',
  imports: [ErrorPageComponent, NgOptimizedImage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './forbidden.component.html'
})
export class ForbiddenComponent {
  public readonly image = '/assets/404.jpg'

  public constructor(layoutService: LayoutService) {
    layoutService.setTitle('干坏事禁止！')
  }

  public goBack() {
    window.history.back()
  }
}

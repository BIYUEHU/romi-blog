import { NgOptimizedImage } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterLink } from '@angular/router'
import { ErrorPageComponent } from '../../components/error-page/error-page.component'

@Component({
  selector: 'app-not-found',
  imports: [ErrorPageComponent, RouterLink, NgOptimizedImage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './not-found.component.html'
})
export class NotFoundComponent {
  public goBack() {
    window.history.back()
  }

  public seekSena(url: 'https://himeno-sena.com') {
    window.open(url, '_blank')
  }
}

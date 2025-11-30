import { NgOptimizedImage } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { ErrorPageComponent } from '../../components/error-page/error-page.component'
import { ROMI_METADATA } from '../../shared/constants'

@Component({
  selector: 'app-server-page',
  imports: [ErrorPageComponent, NgOptimizedImage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './server-error.component.html'
})
export class ServerErrorComponent {
  public notify() {
    window.open(`mailto:${ROMI_METADATA.pkg.author.split('<')[1]}`, '_blank')
  }
}

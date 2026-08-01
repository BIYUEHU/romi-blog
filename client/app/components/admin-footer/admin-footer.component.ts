import { Component } from '@angular/core'
import { COPYRIGHT_YEAR } from '../../shared/constants'

@Component({
  selector: 'app-admin-footer',
  templateUrl: './admin-footer.component.html'
})
export class AdminFooterComponent {
  public readonly copyrightYear = COPYRIGHT_YEAR
}

import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core'
import { RouterLink } from '@angular/router'

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './not-found.component.html'
})
export class NotFoundComponent {
  public currentTime = new Date()
  public currentUser = 'BIYUEHU'

  public goBack(): void {
    window.history.back()
  }
}

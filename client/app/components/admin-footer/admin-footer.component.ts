import { Component } from '@angular/core'

@Component({
  selector: 'app-admin-footer',
  standalone: true,
  templateUrl: './admin-footer.component.html'
})
export class AdminFooterComponent {
  public currentYear = new Date().getFullYear()
}

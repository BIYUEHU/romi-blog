import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core'

@Component({
  selector: 'app-error-page',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './error-page.component.html'
})
export class ErrorPageComponent {
  @Input({ required: true }) public code!: number
}

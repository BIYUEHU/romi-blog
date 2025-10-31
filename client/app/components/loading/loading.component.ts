import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [],
  templateUrl: './loading.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class LoadingComponent {}

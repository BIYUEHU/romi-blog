import { Directive, ElementRef, forwardRef } from '@angular/core'
import { NG_VALUE_ACCESSOR } from '@angular/forms'
import { WebComponentDirectiveFactory } from '../utils/web-component-directive-factory'

@Directive({
  selector: 'r-checkbox',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => WebComponentCheckboxAccessorDirective),
      multi: true
    }
  ]
})
export class WebComponentCheckboxAccessorDirective extends WebComponentDirectiveFactory('change') {
  public constructor(protected host: ElementRef) {
    super()
    this.setup()
  }
}

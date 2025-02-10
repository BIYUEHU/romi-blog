import { Directive, ElementRef, forwardRef } from '@angular/core'
import { NG_VALUE_ACCESSOR } from '@angular/forms'
import { WebComponentDirectiveFactory } from '../utils/web-component-directive-factory'

@Directive({
  selector: 'r-input',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => WebComponentInputAccessorDirective),
      multi: true
    }
  ]
})
export class WebComponentInputAccessorDirective extends WebComponentDirectiveFactory('input') {
  public constructor(protected host: ElementRef) {
    super()
    this.setup()
  }
}

import { Directive, ElementRef, forwardRef } from '@angular/core'
import { NG_VALUE_ACCESSOR } from '@angular/forms'
import { WebComponentDirectiveFactory } from '../shared/web-component-directive-factory'

@Directive({
  selector: 'r-switch',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => WebComponentSwitchAccessorDirective),
      multi: true
    }
  ]
})
export class WebComponentSwitchAccessorDirective extends WebComponentDirectiveFactory('change') {
  public constructor(protected host: ElementRef) {
    super()
    this.setup()
  }
}

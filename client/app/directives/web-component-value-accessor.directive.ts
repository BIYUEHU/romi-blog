// directives/web-component-value-accessor.directive.ts
import { Directive, ElementRef, forwardRef } from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'

@Directive({
  selector: 'r-input',
  standalone: true, // 设置为独立指令
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => WebComponentValueAccessorDirective),
      multi: true
    }
  ]
})
export class WebComponentValueAccessorDirective implements ControlValueAccessor {
  private onChange: (value: string) => void = () => {}
  private onTouched: () => void = () => {}

  constructor(private host: ElementRef) {
    this.host.nativeElement.addEventListener('input', (event: CustomEvent) => {
      this.onChange(event.detail.value)
    })

    this.host.nativeElement.addEventListener('blur', () => {
      this.onTouched()
    })
  }

  writeValue(value: string): void {
    this.host.nativeElement.value = value
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn
  }

  setDisabledState(isDisabled: boolean): void {
    this.host.nativeElement.disabled = isDisabled
  }
}

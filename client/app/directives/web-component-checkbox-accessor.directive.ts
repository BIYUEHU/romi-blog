import { Directive, ElementRef, forwardRef } from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'

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
export class WebComponentCheckboxAccessorDirective implements ControlValueAccessor {
  private onChange: (value: string) => void = () => {}
  private onTouched: () => void = () => {}

  public constructor(private host: ElementRef) {
    this.host.nativeElement.addEventListener('change', (event: { target: HTMLInputElement }) => {
      this.onChange(event.target.value)
    })

    this.host.nativeElement.addEventListener('blur', () => {
      this.onTouched()
    })
  }

  public writeValue(value: string): void {
    this.host.nativeElement.value = value
  }

  public registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn
  }

  public registerOnTouched(fn: () => void): void {
    this.onTouched = fn
  }

  public setDisabledState(isDisabled: boolean): void {
    this.host.nativeElement.disabled = isDisabled
  }
}

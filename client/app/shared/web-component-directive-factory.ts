import { ElementRef } from '@angular/core'
import { ControlValueAccessor } from '@angular/forms'

export function WebComponentDirectiveFactory(eventsNames: string) {
  abstract class WebComponentDirective implements ControlValueAccessor {
    private onChange: (value: string) => void = () => {}
    private onTouched: () => void = () => {}

    protected abstract host: ElementRef

    public setup() {
      this.host.nativeElement.addEventListener(eventsNames, (event: { target: HTMLInputElement }) => {
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
  return WebComponentDirective
}

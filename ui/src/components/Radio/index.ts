import { LitElement, html, css } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import type { Types, Sizes } from '../../preset'
import { getUniqueID } from '../../utils'

@customElement('r-radio')
export default class RRadio extends LitElement {
  @property({ type: String }) public type: Types = 'primary'
  @property({ type: String }) public size: Sizes = 'md'
  @property({ type: String }) public value = false
  @property({ type: Boolean }) public checked = false
  @property({ type: Boolean }) public disabled = false
  @property({ type: Boolean }) public bordered = false
  @property({ type: Boolean, attribute: 'label-left' }) public labelLeft = false
  @property({ type: Boolean, attribute: 'circle-colored' }) public circleColored = false

  private readonly uid = `radio-${getUniqueID()}`

  private handleChange() {
    this.value = !this.value
    this.dispatchEvent(
      new CustomEvent('update:modelValue', {
        detail: this.value,
        bubbles: true,
        composed: true
      })
    )
  }

  public override firstUpdated() {
    if (this.checked) this.value = true
  }

  public override render() {
    const containerClasses = {
      'inline-flex items-center': true,
      'cursor-not-allowed opacity-50': this.disabled,
      'cursor-pointer': !this.disabled,
      'border rounded p-2 transition-colors duration-150 ease-in-out': this.bordered,
      [`border-${this.type}-500`]: this.bordered && this.value,
      'border-gray-300': this.bordered && !this.value && !this.disabled
    }

    const radioClasses = {
      relative: true,
      'h-3 w-3': this.size === 'sm',
      'h-4 w-4': this.size === 'md',
      'h-5 w-5': this.size === 'lg',
      'rounded-full': true,
      'border-2': true,
      'border-solid': true,
      'transition-colors': true,
      [`bg-${this.type}-500 border-${this.type}-500`]: this.value && this.circleColored,
      'bg-white': !this.value || !this.circleColored,
      'border-gray-300 hover:border-gray-400': !this.value && !this.disabled,
      [`border-${this.type}-500`]: this.value || this.circleColored
    }

    return html`
      <label class="${Object.entries(containerClasses)
        .filter(([, value]) => value)
        .map(([key]) => key)
        .join(' ')}">
        ${this.labelLeft ? html`<slot class="mr-2"></slot>` : ''}
        <div class="relative">
          <input
            id="${this.uid}"
            type="radio"
            .checked="${this.value}"
            .disabled="${this.disabled}"
            .value="${this.value}"
            class="radio-input sr-only"
            @change="${this.handleChange}"
          />
          <div class="
            ${this.labelLeft ? 'ml-1 mr-2' : 'mr-1 ml-2'}
            ${Object.entries(radioClasses)
              .filter(([, value]) => value)
              .map(([key]) => key)
              .join(' ')}
          ">
            ${
              this.value
                ? html`
                    <div class="
                      absolute inset-0
                      flex items-center justify-center
                    ">
                      <div class="
                        rounded-full
                        ${this.size === 'sm' ? 'h-1.5 w-1.5' : this.size === 'md' ? 'h-2 w-2' : 'h-2.5 w-2.5'}
                        ${this.circleColored ? 'bg-white' : `bg-${this.type}-500`}
                      "></div>
                    </div>
                  `
                : ''
            }
          </div>
        </div>
        ${this.labelLeft ? '' : html`<slot class="ml-2"></slot>`}
      </label>
    `
  }

  public static override styles = css`@unocss-placeholder`
}

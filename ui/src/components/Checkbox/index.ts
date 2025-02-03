import { LitElement, html, css } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import type { Types, Sizes } from '../../preset'
import { getUniqueID } from '../../utils'

@customElement('r-checkbox')
export default class RCheckbox extends LitElement {
  @property({ type: String }) public type: Types = 'primary'
  @property({ type: String }) public size: Sizes = 'md'
  @property({ type: Boolean }) public checked = false
  @property({ type: Boolean }) public disabled = false
  @property({ type: Boolean, attribute: 'label-left' }) public labelLeft = false
  @property({ type: Boolean }) public value = false

  private readonly uid = `checkbox-${getUniqueID()}`

  private handleChange() {
    this.value = !this.value
    this.dispatchEvent(new CustomEvent('change', { detail: { value: this.value }, bubbles: true, composed: true }))
  }

  public override firstUpdated() {
    if (this.checked) this.value = true
  }

  public override render() {
    return html`
      <label class="inline-flex items-center ${this.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}">
        ${this.labelLeft ? html`<slot class="mr-2"></slot>` : ''}
        <div class="relative">
          <input
            id="${this.uid}"
            type="checkbox"
            .checked="${this.value}"
            .disabled="${this.disabled}"
            .value="${this.value}"
            class="checkbox-input sr-only"
            @change="${this.handleChange}"
          />
          <div class="
            ${this.labelLeft ? 'ml-1 mr-2' : 'mr-1 ml-2'}
            relative
            ${this.size === 'sm' ? 'h-3 w-3' : this.size === 'md' ? 'h-4 w-4' : 'h-5 w-5'}
            rounded
            border-1
            border-solid
            transition-colors
            ${
              this.value
                ? `bg-${this.type}-500 border-${this.type}-500`
                : 'bg-white border-gray-300 hover:border-gray-400'
            }
          ">
            ${
              this.value
                ? html`
              <div class="
                absolute inset-0
                flex items-center justify-center
                text-white
              ">
                <div class="i-mdi:check ${this.size === 'sm' ? 'text-xs' : this.size === 'md' ? 'text-sm' : 'text-base'}"></div>
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

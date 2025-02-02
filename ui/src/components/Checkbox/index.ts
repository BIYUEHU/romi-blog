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
  @property() public modelValue = false
  // biome-ignore lint:
  @property() public value: any = null
  @property({ attribute: 'checked-value' }) public checkedValue = true
  @property({ attribute: 'unchecked-value' }) public uncheckedValue = false

  private uid = `checkbox-${getUniqueID()}`

  public render() {
    const wrapperClass = `
      checkbox-wrapper
      inline-flex items-center
      ${this.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
    `

    return html`
      <label class="${wrapperClass}">
        ${this.labelLeft ? html`<slot class="mr-2"></slot>` : ''}
        <div class="relative">
          <input
            id="${this.uid}"
            type="checkbox"
            .checked="${false}"
            .disabled="${this.disabled}"
            .value="${this.value}"
            class="checkbox-input sr-only"
          />
          <div class="
            checkbox-custom
            relative
            ${this.size === 'sm' ? 'h-4 w-4' : this.size === 'md' ? 'h-5 w-5' : 'h-6 w-6'}
            rounded
            border
            transition-colors
            ${false ? `bg-${this.type}-500 border-${this.type}-500` : 'bg-white border-gray-300 hover:border-gray-400'}
          ">
            ${
              false
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
        ${!this.labelLeft ? html`<slot class="ml-2"></slot>` : ''}
      </label>
    `
  }

  public static styles = css`@unocss-placeholder;
  
      
  .checkbox-wrapper {
    -webkit-tap-highlight-color: transparent;
  }

  .checkbox-custom {
    cursor: inherit;
    display: inline-block;
    vertical-align: middle;
  }

  .checkbox-input:focus-visible + .checkbox-custom {
    outline: 2px solid rgb(var(--un-primary-500));
    outline-offset: 2px;
  }

  /* 禁用状态样式 */
  .checkbox-input:disabled + .checkbox-custom {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* 动画效果 */
  .checkbox-custom {
    transition: all 0.2s ease;
  }`
}

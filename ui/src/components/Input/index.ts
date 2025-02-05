import { LitElement, html, css } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import type { Sizes } from '../../preset'

@customElement('r-input')
export default class RInput extends LitElement {
  @property({ type: String }) public value: string | number = ''
  @property({ type: String }) public label = ''
  @property({ type: String }) public type = 'text'
  @property({ type: String }) public size: Sizes = 'md'
  @property({ type: String }) public as: 'input' | 'textarea' = 'input'
  @property({ type: Number }) public rows = 1
  @property({ type: Boolean }) public disabled = false
  @property({ type: Boolean }) public required = false
  @property({ type: String, attribute: 'error-message', reflect: true }) public errorMessage = ''
  @property({ type: String }) public placeholder = 'Please input'
  @property({ type: Boolean }) public clearable = false
  @property({ type: String }) public leftIcon = ''
  @property({ type: String }) public rightIcon = ''

  @state() protected focused = false

  private handleChange() {
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: this.value },
        bubbles: true,
        composed: true
      })
    )
  }

  private handleInput(e: Event) {
    const input = e.target as HTMLInputElement
    this.value = input.value
    this.errorMessage = ''
    this.dispatchEvent(
      new CustomEvent('input', {
        detail: { value: this.value },
        bubbles: true,
        composed: true
      })
    )
  }

  private handleClear() {
    this.value = ''
    this.dispatchEvent(
      new CustomEvent('clear', {
        bubbles: true,
        composed: true
      })
    )
  }

  private handleIconClick(position: 'left' | 'right') {
    this.dispatchEvent(
      new CustomEvent(`click${position}`, {
        bubbles: true,
        composed: true
      })
    )
  }

  public override render() {
    const classTag = `
    w-full text-sm
    border-0 rounded z-2
    bg-white ring-1 ring-inset ring-gray-300
    focus:outline-none focus:ring-2 focus:ring-primary-600
    placeholder:text-gray-400 placeholder:text-sm
    ${this.disabled ? 'cursor-not-allowed' : ''}
    ${this.errorMessage ? 'ring-error-500 focus:ring-error-500' : ''}
    ${this.size === 'sm' ? 'py-1' : this.size === 'md' ? 'py-2' : 'py-3'}
    ${this.leftIcon ? 'pl-10' : 'pl-3'}
    ${
      this.rightIcon && !this.clearable
        ? 'pr-10'
        : !this.rightIcon && this.clearable
          ? 'pr-10'
          : this.rightIcon && this.clearable
            ? 'pr-15'
            : 'pr-3'
    }`

    return html`
      <div class="w-full flex flex-col ${this.disabled ? 'opacity-60' : ''}">
        ${
          this.label || this.required
            ? html`
          <label class="self-start mb-1 text-sm font-medium">
            ${this.label}
            ${this.required ? html`<span class="text-error-500">*</span>` : ''}
          </label>
        `
            : ''
        }

        <div class="flex">
          <div class="flex items-center mr-1">
            <slot name="prepend" class="
              border border-r-0 rounded-l-md px-3 text-sm
              ${this.size === 'sm' ? 'py-0.5' : this.size === 'md' ? 'py-1.5' : 'py-2'}
            "></slot>
          </div>

          <div class="relative w-full flex items-center">
            ${
              this.leftIcon
                ? html`
              <div class="absolute left-3 z-10">
                <div
                  class="h-5 w-5 ${this.leftIcon} cursor-pointer"
                  @click="${() => this.handleIconClick('left')}"
                ></div>
              </div>
            `
                : ''
            }

            ${
              this.as === 'input'
                ? html`<input
              .value="${this.value}"
              .type="${this.type}"
              ?disabled="${this.disabled}"
              placeholder="${this.placeholder}"
              class="${classTag}"
              @focus="${() => {
                this.focused = true
              }}"
              @blur="${() => {
                this.focused = false
              }}"
              @change="${this.handleChange}"
              @input="${this.handleInput}"
            />`
                : html`<textarea
              .value="${this.value}"
              ?disabled="${this.disabled}"
              placeholder="${this.placeholder}"
              class="${classTag}"
              rows="${this.rows}"
              @focus="${() => {
                this.focused = true
              }}"
              @blur="${() => {
                this.focused = false
              }}"
              @change="${this.handleChange}"
              @input="${this.handleInput}"
            ></textarea>`
            }

            ${
              this.rightIcon
                ? html`
              <div class="absolute right-3 z-10">
                <div 
                  class="h-5 w-5 ${this.rightIcon} cursor-pointer"
                  @click="${() => this.handleIconClick('right')}"
                ></div>
              </div>
            `
                : ''
            }

            ${
              this.value && this.clearable
                ? html`
              <div class="
                absolute z-10
                ${this.rightIcon ? 'right-10' : 'right-3'}
              ">
                <div
                  class="i-mdi:close-circle-outline h-5 w-5 cursor-pointer
                    text-gray-400 duration-300 hover:text-gray-500"
                  @click="${this.handleClear}"
                ></div>
              </div>
            `
                : ''
            }
          </div>

          <div class="flex items-center ml-1">
            <slot name="append" class="
              border border-l-0 rounded-r-md px-3 text-sm
              ${this.size === 'sm' ? 'py-0.5' : this.size === 'md' ? 'py-1.5' : 'py-2'}
            "></slot>
          </div>
        </div>

        ${
          this.errorMessage
            ? html`
          <span class="flex self-start text-error-500 mt-1 text-xs">
            ${this.errorMessage}
          </span>
        `
            : ''
        }
      </div>
    `
  }

  public static override styles = css`@unocss-placeholder`
}

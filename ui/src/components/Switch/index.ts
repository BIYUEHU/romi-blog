import { LitElement, html, css } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import type { Sizes, Types } from '../../preset'
import { getUniqueID } from '../../utils'

interface Theme {
  color: string
  text: string
  focus: string
}

@customElement('r-switch')
export default class RSwitch extends LitElement {
  @property({ type: String }) public type: Types = 'primary'
  @property({ type: String }) public size: Sizes = 'md'
  @property({ type: Boolean }) public loading = false
  @property({ type: Boolean }) public checked = false
  @property({ type: Boolean }) public disabled = false
  @property({ type: Boolean }) public readonly = false
  @property({ type: Boolean }) public value = false

  @state() private readonly uid = `switch-${getUniqueID()}`

  public override firstUpdated() {
    if (this.checked) this.value = true
  }

  private handleChange() {
    this.value = !this.value
    this.dispatchEvent(new CustomEvent('change', { detail: { value: this.value }, bubbles: true, composed: true }))
  }

  public override render() {
    return html`
      <div class="flex items-center">
        <label
          for="${this.uid}"
          class="
            flex select-none items-center
            ${this.disabled ? 'cursor-not-allowed opacity-60' : this.readonly ? '' : 'cursor-pointer'}
          "
        >
          <div class="mr-1 font-medium leading-6 text-gray-900">
            <slot></slot>
          </div>

          <div tabindex="0" class="relative mr-2">
            <input
              id="${this.uid}"
              type="checkbox"
              ?disabled="${this.disabled}"
              .checked="${this.value}"
              .value="${this.value}"
              @change="${this.handleChange}"
              class="sr-only"
            >
            <div class="
              block rounded-full
              ${this.value ? RSwitch.reflect[this.type].color : 'bg-gray-200'}
              ${this.size === 'sm' ? 'h-4 w-9' : this.size === 'md' ? 'h-6 w-11' : 'h-9 w-14'}
            "></div>

            <div class="
              absolute left-0 top-0.5 rounded-full bg-white transition
              ${this.value ? 'translate-x-5' : 'translate-x-0'}
              ${this.size === 'sm' ? 'h-3 w-3' : this.size === 'md' ? 'h-5 w-5' : 'h-8 w-8'}
            ">
              ${
                this.loading
                  ? html`
              <svg
                class="
                  animate-spin
                  ${this.size === 'sm' ? 'h-3 w-3' : this.size === 'md' ? 'h-5 w-5' : 'h-8 w-8'}
                "
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
              >
                <!-- Loading SVG path -->
                <defs>
                  <linearGradient id="mingcuteLoadingLine0" x1="50%" x2="50%" y1="5.271%" y2="91.793%">
                    <stop offset="0%" stop-color="#888888" />
                    <stop offset="100%" stop-color="currentColor" stop-opacity=".55" />
                  </linearGradient>
                  <linearGradient id="mingcuteLoadingLine1" x1="50%" x2="50%" y1="8.877%" y2="90.415%">
                    <stop offset="0%" stop-color="currentColor" stop-opacity="0" />
                    <stop offset="100%" stop-color="currentColor" stop-opacity=".55" />
                  </linearGradient>
                </defs>
                <g fill="none">
                  <!-- SVG paths -->
                </g>
              </svg>
            `
                  : ''
              }
            </div>
          </div>
        </label>
      </div>
    `
  }

  private static reflect: Record<Types, Theme> = {
    success: {
      color: 'bg-success-500',
      text: 'text-success-500',
      focus: 'focus:ring-success-500'
    },
    info: {
      color: 'bg-info-500',
      text: 'text-info-500',
      focus: 'focus:ring-info-500'
    },
    warning: {
      color: 'bg-warning-500',
      text: 'text-warning-500',
      focus: 'focus:ring-warning-500'
    },
    error: {
      color: 'bg-error-500',
      text: 'text-error-500',
      focus: 'focus:ring-error-500'
    },
    primary: {
      color: 'bg-primary-500',
      text: 'text-primary-500',
      focus: 'focus:ring-primary-500'
    },
    secondary: {
      color: 'bg-secondary-500',
      text: 'text-secondary-500',
      focus: 'focus:ring-secondary-500'
    },
    accent: {
      color: 'bg-accent-500',
      text: 'text-accent-500',
      focus: 'focus:ring-accent-500'
    }
  }

  public static override styles = css`@unocss-placeholder`
}

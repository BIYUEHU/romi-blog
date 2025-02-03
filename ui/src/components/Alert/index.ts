import { LitElement, html, css } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import type { Types } from '../../preset'

@customElement('r-alert')
export default class RAlert extends LitElement {
  @property({ type: String }) public type: Types = 'primary'
  @property({ type: String }) public icon = ''
  @property({ type: Boolean }) public closeable = false
  @property({ type: Boolean, attribute: 'no-icon' }) public noIcon = false
  @property({ type: Boolean }) public colorful = false
  @property({ type: Boolean }) public bordered = false

  private onClose() {
    this.dispatchEvent(new CustomEvent('close', { detail: {}, bubbles: true, composed: true }))
  }

  public override render() {
    const classTag = `
      max-w-lg flex justify-between rounded-lg px-4 py-3
      ${this.colorful ? `bg-${this.type}-50 text-${this.type}-800` : 'bg-white text-gray-700'}
      ${this.bordered ? 'border-1 border-solid' : 'border-none shadow'}
    `
    return html`
      <div class="${classTag}">
        <div class="flex">
          ${this.noIcon ? '' : html`<div class="mr-3 h-6 w-6 ${this.icon || RAlert.relfect[this.type]}"></div>`}
          <slot></slot>
        </div>
        ${
          this.closeable
            ? html`
          <div class="ml-2 h-6 w-6 flex items-center justify-center">
            <button @click="${this.onClose}" class="i-mdi:close h-4 w-4 cursor-pointer transition hover:scale-125"></button>
          </div>
        `
            : ''
        }
      </div>
    `
  }

  private static relfect: Record<Types, string> = {
    success: 'i-mdi:check-circle text-success-500',
    info: 'i-mdi:information text-info-500',
    warning: 'i-mdi:alert-circle text-warning-500',
    error: 'i-mdi:close-circle text-error-500',
    primary: 'i-mdi:information-slab-circle text-primary-500',
    secondary: 'i-mdi:information-slab-circle text-secondary-500',
    accent: 'i-mdi:information-slab-circle text-accent-500'
  }

  public static override styles = css`@unocss-placeholder`
}

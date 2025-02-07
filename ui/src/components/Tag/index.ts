import { LitElement, html, css } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import type { Types, Sizes } from '../../preset'

@customElement('r-tag')
export default class RTag extends LitElement {
  @property({ type: String }) public type: Types | 'default' = 'default'
  @property({ type: String }) public size: Exclude<Sizes, 'full'> = 'md'
  @property({ type: String }) public rounded: Sizes = 'sm'
  @property({ type: Boolean }) public bordered = false
  @property({ type: Boolean }) public closeable = false
  @property({ type: Boolean }) public hovered = false

  private handleClose() {
    this.dispatchEvent(
      new CustomEvent('close', {
        bubbles: true,
        composed: true
      })
    )
  }

  public override render() {
    return html`
      <div class="flex items-center">
        <div
          class="
            block cursor-default whitespace-nowrap text-xs font-medium shadow-sm
            rounded-${this.rounded}
            ${this.type === 'default' ? 'bg-gray-100 text-gray-800' : `bg-${this.type}-100 text-${this.type}-800`}
            ${RTag.reflect[this.size as this['size']]}
            ${this.bordered ? 'border border-gray-300' : ''}
            ${this.hovered ? 'hover:cursor-pointer' : ''}
          "
        >
          <div class="flex items-center justify-center">
            ${
              this.closeable
                ? html`
                <div class="flex">
                  <slot></slot>
                  <svg
                    class="
                      ml-1 h-4 w-4 cursor-pointer stroke-2
                      transition-colors duration-150 ease-in-out
                      hover:text-gray-700
                    "
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-linejoin="round"
                    stroke-linecap="round"
                    fill="none"
                    role="presentation"
                    @click="${this.handleClose}"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>
              `
                : html`<slot></slot>`
            }
          </div>
        </div>
      </div>
    `
  }

  private static reflect: Record<Exclude<Sizes, 'full'>, string> = {
    sm: 'px-2 py-1',
    md: 'px-3 py-1.5',
    lg: 'px-6 py-3'
  }

  public static override styles = css`@unocss-placeholder`
}

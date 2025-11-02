import { css, html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import type { Sizes, Types } from '../../preset'

@customElement('r-button')
export default class RButton extends LitElement {
  @property({ type: Boolean }) public asLink = false
  @property({ type: String }) public type: Types | 'default' = 'default'
  @property({ type: String }) public size: Exclude<Sizes, 'full'> = 'md'
  @property({ type: Boolean }) public disabled = false
  @property({ type: Boolean }) public bordered = false

  public override render() {
    const classTag = `cursor-pointer items-center justify-center whitespace-nowrap rounded-md font-sans text-xs font-semibold leading-4 ${this.bordered ? 'border-1 border-solid' : 'border-none'} shadow-sm disabled:cursor-not-allowed disabled:opacity-30 focus:outline-none focus:ring-offset-2 ${
      this.type === 'default'
        ? 'text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-gray-500'
        : `text-white bg-${this.type}-500 hover:bg-${this.type}-600 focus:ring-${this.type}-500`
    } ${this.size === 'sm' ? 'px-2 py-1' : this.size === 'md' ? 'px-3 py-2' : 'px-4 py-3'}`
    return html`
      <span class="items-center">
      ${
        this.asLink
          ? html`
              <a class="${classTag}" ?disabled="${this.disabled}" aria-disabled="${this.disabled}">
                <slot></slot>
              </a>
            `
          : html`
                <button type="button" class="${classTag}" ?disabled="${this.disabled}"
                        ?aria-disabled="${this.disabled}">
                  <slot></slot>
                </button>
              `
      }
      </span>
    `
  }

  public static override styles = css`@unocss-placeholder`
}

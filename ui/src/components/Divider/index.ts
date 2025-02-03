import { LitElement, html, css } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('r-divider')
export default class RDivider extends LitElement {
  @property({ type: String }) public align: 'left' | 'right' | 'center' = 'center'
  @property({ type: Boolean }) public dashed = false
  @property({ type: Number }) public thickness: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 = 2

  public override render() {
    return html`
      <div class="w-full">
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="
              w-full border-solid border-0 border-gray-300
              ${`border-t-${this.thickness}`}
              ${this.dashed ? 'border-dashed' : ''}
            "></div>
          </div>
          <div class="
            relative flex
            ${this.align === 'center' ? 'justify-center' : this.align === 'right' ? 'justify-end' : 'justify-start'}
          ">
            <slot></slot>
          </div>
        </div>
      </div>
    `
  }

  public static override styles = css`@unocss-placeholder`
}

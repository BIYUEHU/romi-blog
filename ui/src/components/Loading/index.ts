import { LitElement, html, css } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import type { Sizes, Types } from '../../preset'

@customElement('r-loading')
export default class RLoading extends LitElement {
  @property({ type: String }) public type: Types = 'primary'
  @property({ type: String }) public size: Exclude<Sizes, 'full'> = 'md'
  @property({ type: Number }) public thickness = 5
  @property({ type: String }) public label = ''

  public override render() {
    return html`<div class="inline-flex flex-col justify-center items-center">
      <div class="${RLoading.reflect[this.size]}">
          <div class="
            inline-block h-full w-full
            animate-spin border-solid border-gray-300 rounded-full bg-transparent
            ${`border-r-${this.type}-500`}
            ${`border-${this.thickness}`}
          ">
          </div>
      </div>
      ${this.label ? html`<div class="mt-2 ml-3 text-gray-500 ${this.size !== 'md' ? `text-${this.size}` : ''}">${this.label}</div>` : ''}
    </div>`
  }

  private static reflect: Record<Exclude<Sizes, 'full'>, string> = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  }

  public static override styles = css`@unocss-placeholder`
}

import { LitElement, html, css } from 'lit'
import { customElement } from 'lit/decorators.js'

@customElement('r-skeleton')
export default class RSkeleton extends LitElement {
  public override render() {
    return html`<div class="animate-pulse ${this.className?.includes('w-') ? '' : 'w-40'} ${this.className?.includes('h-') ? '' : 'h-10'} ${this.className?.includes('rounded-') ? '' : 'rounded-md'} ${this.className?.includes('bg-') ? '' : 'bg-gray-200'}
        ${this.className || ''}"></div>`
  }

  public static override styles = css`@unocss-placeholder`
}

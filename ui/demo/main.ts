import '../styles.css'
import '../../client/app/styles/index.css'
import '../src/'
import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('my-element')
export class MyElement extends LitElement {
  @property()
  public docsHint = 'Click on the Vite and Lit logos to learn more'

  @property({ type: Number })
  public count = 0

  public override render() {
    return html`
      <slot></slot>
      <div class="card">
        <button @click=${this.onClick} part="button">
          count is ${this.count}
        </button>
      </div>
      <p class="text-red">${this.docsHint}</p>
    `
  }

  private onClick() {
    this.count++
  }

  public static override styles = css`@unocss-placeholder`
}

declare global {
  interface HTMLElementTagNameMap {
    'my-element': MyElement
  }
}

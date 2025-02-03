import { LitElement, html, css } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'

@customElement('r-collapse')
export default class RCollapse extends LitElement {
  @property({ type: Boolean }) public expanded = false
  @property({ type: Boolean }) public disabled = false
  @property({ type: Boolean, attribute: 'icon-left' }) public iconLeft = false
  @property({ type: String }) public label = ''

  @state() private collapsed = true
  @state() private expandedCompleted = false
  @state() private maxHeight = 0

  private toggleExpand() {
    if (this.disabled) return

    this.expandedCompleted = false

    if (this.collapsed) {
      setTimeout(() => {
        this.expandedCompleted = true
      }, 300)
    }

    this.collapsed = !this.collapsed
    this.resizeContent()
  }

  private resizeContent() {
    this.maxHeight = this.collapsed ? 0 : this.offsetHeight
  }

  public override connectedCallback() {
    super.connectedCallback()
    setTimeout(() => this.resizeContent(), 0)
  }

  public override firstUpdated() {
    if (this.expanded) this.collapsed = false
  }

  public override render() {
    return html`
      <div class="border border-gray-100 border-solid rounded-md p-4">
        <div
          class="
            flex items-start
            ${this.disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
            ${this.iconLeft ? 'flex-row-reverse' : ''}
          "
          @click="${this.toggleExpand}"
        >
          <div class="flex-1 flex self-start">${this.label}</div>
          <div class="
            transition transition-transform duration-200 ease-in-out
            ${this.iconLeft ? 'mr-2' : 'ml-2'}
            ${!this.collapsed ? 'rotate-180' : ''}
          ">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-5 text-gray-500"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          </div>
        </div>
        <div
          class="
            transition-all duration-300 ease-in-out
            ${this.expandedCompleted ? '' : 'overflow-y-hidden'}
          "
          style="max-height: ${this.maxHeight}px"
        >
            <slot class="flex self-start mt-4"></slot>
        </div>
      </div>
    `
  }

  public static override styles = css`@unocss-placeholder`
}

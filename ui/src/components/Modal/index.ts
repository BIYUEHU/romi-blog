import { css, html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'

type ModalWidth = 'sm' | 'base' | 'md' | 'lg' | 'xl' | 'full'

@customElement('r-modal')
export default class RModal extends LitElement {
  @property({ type: Boolean }) modelValue = false
  @property({ type: Boolean }) dismissible = true
  @property({ type: Boolean, attribute: 'dismiss-button' }) dismissButton = true
  @property({ type: String }) width: ModalWidth = 'base'
  @property({ type: Boolean }) padded = true
  @property({ type: Number }) zIndex = 30

  private modalContainer?: HTMLElement = document.body

  // 创建 modal 容器并添加到 body
  private createModalContainer() {
    this.modalContainer = document.createElement('div')
    document.body.appendChild(this.modalContainer)
    this.requestUpdate()
  }

  // 移除 modal 容器
  private removeModalContainer() {
    this.modalContainer?.remove()
    this.modalContainer = void 0
  }

  private close() {
    if (this.dismissible) {
      this.modelValue = false
      this.dispatchEvent(
        new CustomEvent('update:modelValue', {
          detail: false,
          bubbles: true,
          composed: true
        })
      )
      this.dispatchEvent(
        new CustomEvent('close', {
          bubbles: true,
          composed: true
        })
      )
    }
  }

  public override connectedCallback() {
    super.connectedCallback()
    this.createModalContainer()
  }

  public override disconnectedCallback() {
    super.disconnectedCallback()
    this.removeModalContainer()
  }

  protected override render() {
    if (!this.modalContainer) return null

    const modalContent = html`
      <div 
        class="fixed inset-0 overflow-y-auto transition-all ease-in ${this.modelValue ? 'visible' : 'invisible duration-100 ease-in'}"
        style="z-index: ${this.zIndex}"
      >
        <!-- overlay -->
        <div 
          class="
            fixed inset-0 bg-gray-500 transition-opacity dark:bg-gray-600
            ${this.modelValue ? 'opacity-75 duration-75 ease-out' : 'opacity-0 duration-75 ease-in'}
          "
          @click="${(e: Event) => {
            if (e.target === e.currentTarget) this.close()
          }}"
        ></div>

        <!-- dialog -->
        <div class="min-h-full flex items-center justify-center p-2 sm:p-6">
          <div
            class="
              relative inline-block w-full rounded-lg
              bg-white shadow-xl transition-all dark:bg-gray-900
              ${this.padded ? 'p-4 sm:p-6' : 'p2'}
              ${this.getWidthClass()}
              ${
                this.modelValue
                  ? 'translate-y-0 opacity-100 duration-300 sm:scale-100'
                  : 'translate-y-4 opacity-0 duration-300 sm:translate-y-0 sm:scale-95'
              }
            "
            role="dialog"
            aria-modal="true"
          >
            ${
              this.dismissButton
                ? html`
              <button
                class="
                  absolute right-4 top-4 h-6 w-6 rounded-full
                  bg-gray-100 p-1 text-gray-700 hover:bg-gray-200
                  focus:outline-none focus:ring-2 focus:ring-gray-500
                "
                aria-label="close"
                @click="${this.close}"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    stroke-linecap="round" 
                    stroke-linejoin="round" 
                    stroke-width="2" 
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            `
                : ''
            }

            <slot name="header"></slot>
            <slot></slot>
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    `

    // 使用 Portal 渲染到 body
    if (this.modalContainer) {
      this.modalContainer.innerHTML = ''
      this.modalContainer.appendChild(this.renderRoot)
    }

    return modalContent
  }

  private getWidthClass(): string {
    const widthClasses = {
      sm: 'sm:max-w-sm',
      base: 'sm:max-w-lg',
      md: 'sm:max-w-xl',
      lg: 'sm:max-w-3xl',
      xl: 'sm:max-w-5xl',
      full: 'sm:max-w-full'
    }
    return widthClasses[this.width] || widthClasses.base
  }

  public static override styles = css`@unocss-placeholder`
}

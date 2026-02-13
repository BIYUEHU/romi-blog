import { css, html, LitElement } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'

interface DropdownOption {
  value: string
  label: string
  icon?: string
  disabled?: boolean
}

@customElement('r-dropdown')
export default class RDropdown extends LitElement {
  @property({ type: Array }) public options: DropdownOption[] = []
  @property({ type: String }) public trigger: 'click' | 'hover' = 'click'

  @query('.target') private targetRef!: HTMLElement
  @query('.dropdown') private dropdownRef!: HTMLElement

  @state() private show = false
  private timeout?: ReturnType<typeof setTimeout>

  private showPanel() {
    this.show = true
    clearTimeout(this.timeout)

    setTimeout(() => {
      if (this.targetRef && this.dropdownRef) {
        const rect = this.targetRef.getBoundingClientRect()
        const center = window.innerHeight / 2
        const middle = window.innerWidth / 2

        if (rect.top > center) {
          this.dropdownRef.style.bottom = 'calc(100% + 0.5rem)'
        } else {
          this.dropdownRef.classList.add('mt-2')
        }

        if (rect.right > middle) {
          this.dropdownRef.classList.add('right-0')
        } else {
          this.dropdownRef.classList.add('left-0')
        }
      }
    }, 0)
  }

  private closePanel() {
    this.timeout = setTimeout(
      () => {
        this.show = false
      },
      this.trigger === 'hover' ? 200 : 0
    )
  }

  private select(option: DropdownOption) {
    if (option.disabled) return

    this.show = false
    this.timeout = void 0
    this.dispatchEvent(
      new CustomEvent('select', {
        detail: option,
        bubbles: true,
        composed: true
      })
    )
  }

  private handleClickOutside(event: MouseEvent) {
    if (this.trigger === 'click' && !this.contains(event.target as Node)) {
      this.closePanel()
    }
  }

  public override connectedCallback() {
    super.connectedCallback()
    document.addEventListener('click', this.handleClickOutside.bind(this))
  }

  public override disconnectedCallback() {
    super.disconnectedCallback()
    document.removeEventListener('click', this.handleClickOutside.bind(this))
  }

  public override render() {
    return html`
      <div 
        class="relative inline-block text-left"
        @mouseleave="${() => this.trigger === 'hover' && this.closePanel()}"
      >
        <div
          class="target w-full inline-flex items-center justify-center rounded-md"
          @mouseenter="${() => this.trigger === 'hover' && this.showPanel()}"
          @click="${() => this.trigger === 'click' && this.showPanel()}"
        >
          <slot></slot>
        </div>

        ${
          this.show
            ? html`
          <div
            class="
              dropdown absolute z-10 min-w-max rounded-lg
              bg-white shadow-lg dark:bg-slate-800
              transition duration-200 ease-out
              ${this.show ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'}
            "
            tabindex="-1"
            @mouseenter="${() => this.showPanel()}"
          >
            <div class="py-1">
              <div class="px-1 py-2 text-sm">
                ${this.options.map((option) =>
                  option
                    ? html`
                  <div
                    class="
                      flex cursor-pointer items-center rounded-md px-3 py-1
                      ${
                        option.disabled
                          ? 'text-gray-700 opacity-50 cursor-not-allowed'
                          : 'hover:bg-primary-200 hover:text-primary-600'
                      }
                    "
                    @click="${(e: Event) => {
                      e.stopPropagation()
                      this.select(option)
                    }}"
                  >
                    ${
                      option.icon
                        ? html`
                      <div class="${option.icon} w-5 text-gray-500"></div>
                    `
                        : ''
                    }
                    <span class="ml-2">${option.label}</span>
                  </div>
                `
                    : html`
                  <div class="my-2 border dark:border-slate-600"></div>
                `
                )}
              </div>
            </div>
          </div>
        `
            : ''
        }
      </div>
    `
  }

  public static override styles = css`@unocss-placeholder`
}

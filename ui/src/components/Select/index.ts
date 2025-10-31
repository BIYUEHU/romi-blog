import { css, html, LitElement } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import type { Types } from '../../preset'
import { getUniqueID } from '../../utils'

interface SelectOption {
  label: string
  value: string | number
  [key: string]: unknown
}

@customElement('r-select')
export default class RSelect extends LitElement {
  @property({ type: String }) public type: Types = 'primary'
  @property({ type: String }) public label = ''
  @property() public modelValue: string | number | null = null
  @property({ type: String }) public placeholder = 'Please select'
  @property({ type: Boolean }) public disabled = false
  @property({ type: Boolean }) public clearable = false
  @property({ type: Boolean }) public filterable = false
  @property({ type: Array }) public options: SelectOption[] = []
  @property({ type: String }) public errorMessage = ''

  @state() private isOpen = false
  @state() private inputValue = ''

  private readonly uid = `select-${getUniqueID()}`

  public constructor() {
    super()
    this.handleClickOutside = this.handleClickOutside.bind(this)
  }

  public override connectedCallback() {
    super.connectedCallback()
    document.addEventListener('click', this.handleClickOutside)
    this.inputValue = this.selectedLabel(this.modelValue)
  }

  public override disconnectedCallback() {
    super.disconnectedCallback()
    document.removeEventListener('click', this.handleClickOutside)
  }

  private handleClickOutside(event: MouseEvent) {
    if (!this.contains(event.target as Node)) {
      this.closeDropdown()
    }
  }

  private selectedLabel(value: string | number | null): string {
    return this.options.find((opt) => opt.value === value)?.label || ''
  }

  private get filteredOptions(): SelectOption[] {
    if (!this.filterable) return this.options
    const searchValue = this.inputValue.toLowerCase()
    return this.options.filter((opt) => opt.label.toLowerCase().includes(searchValue))
  }

  private handleSelect(option: SelectOption) {
    if (this.disabled) return

    this.modelValue = option.value
    this.inputValue = option.label
    this.closeDropdown()
    this.emitUpdate(option.value)
  }

  private toggleDropdown() {
    if (this.disabled) return
    this.isOpen = !this.isOpen
  }

  private closeDropdown() {
    this.isOpen = false
    if (!this.modelValue) {
      this.inputValue = ''
    }
  }

  private handleChange(e: Event) {
    this.dispatchEvent(new CustomEvent('input', { detail: { value: 1 }, bubbles: true, composed: true }))
    if (!this.filterable) return

    const value = (e.target as HTMLInputElement).value
    this.inputValue = value
    this.isOpen = true

    if (!value && this.modelValue) {
      this.modelValue = null
      this.emitUpdate(null)
    }
  }

  private handleClear(e: Event) {
    e.stopPropagation()
    this.modelValue = null
    this.inputValue = ''
    this.emitUpdate(null)
  }

  private emitUpdate(value: string | number | null) {
    this.dispatchEvent(
      new CustomEvent('@update:modelValue="${(e: CustomEvent) => console.log(e.detail)}', {
        detail: { value },
        bubbles: true,
        composed: true
      })
    )
  }

  private renderInput() {
    const inputClasses = {
      'w-full': true,
      'rounded-md': true,
      'py-1.5 px-3': true,
      'text-sm': true,
      'bg-white': true,
      'shadow-sm': true,
      'ring-1 ring-inset': true,
      'focus:ring-2': true,
      'transition-colors duration-150': true,
      'cursor-not-allowed opacity-40': this.disabled,
      'cursor-default': !this.disabled,
      [`ring-${this.type}-500 focus:ring-${this.type}-600`]: !this.errorMessage,
      'ring-red-500 focus:ring-red-500 text-red-500': !!this.errorMessage
    }

    return html`
      <div class="relative">
        <input
          id="${this.uid}"
          type="text"
          class="${Object.entries(inputClasses)
            .filter(([, value]) => value)
            .map(([key]) => key)
            .join(' ')}"
          ?disabled="${this.disabled}"
          ?readonly="${!this.filterable}"
          placeholder="${this.placeholder}"
          .value="${this.inputValue}"
          @click="${this.toggleDropdown}"
          @change="${this.handleChange}"
          @input="${this.handleChange}"
        >
        ${this.renderTrigger()}
      </div>
    `
  }

  private renderTrigger() {
    return html`
      <div 
        class="
          absolute inset-y-0 right-0 flex items-center pr-2
          ${this.disabled ? 'opacity-40' : ''}
        "
      >
        ${
          this.clearable && this.modelValue
            ? html`
            <button
              type="button"
              class="
                p-1 text-gray-400 hover:text-gray-500
                ${this.disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
              "
              @click="${this.handleClear}"
            >
              <div class="i-mdi:close h-4 w-4"></div>
            </button>
          `
            : ''
        }
        <div class="i-mdi:chevron-down h-4 w-4 transition-transform duration-150
          ${this.isOpen ? 'rotate-180' : ''}"></div>
      </div>
    `
  }

  private renderDropdown() {
    if (!this.isOpen || !this.filteredOptions.length) return ''

    return html`
      <div class="
        absolute z-50 mt-1 w-full rounded-md bg-white py-1
        shadow-lg ring-1 ring-black ring-opacity-5
        max-h-60 overflow-auto
      ">
        ${this.filteredOptions.map((option) => this.renderOption(option))}
      </div>
    `
  }

  private renderOption(option: SelectOption) {
    const isSelected = this.modelValue === option.value
    const optionClasses = {
      relative: true,
      'py-2 px-3': true,
      'cursor-pointer select-none': true,
      'transition-colors duration-150': true,
      'text-gray-900': !isSelected,
      [`text-${this.type}-600`]: isSelected,
      [`hover:bg-${this.type}-50`]: !isSelected,
      [`bg-${this.type}-50`]: isSelected
    }

    return html`
      <div
        class="${Object.entries(optionClasses)
          .filter(([, value]) => value)
          .map(([key]) => key)
          .join(' ')}"
        @click="${() => this.handleSelect(option)}"
      >
        <slot name="option" .option="${option}" ?selected="${isSelected}">
          <div class="flex items-center justify-between">
            <span class="block truncate">${option.label}</span>
            ${
              isSelected
                ? html`
              <div class="i-mdi:check h-4 w-4 ${`text-${this.type}-600`}"></div>
            `
                : ''
            }
          </div>
        </slot>
      </div>
    `
  }

  public override render() {
    return html`
      <div class="relative">
        ${
          this.label
            ? html`
          <label 
            for="${this.uid}"
            class="block mb-1 text-sm font-medium text-gray-900"
          >${this.label}</label>
        `
            : ''
        }
        
        ${this.renderInput()}
        ${this.renderDropdown()}
        
        ${
          this.errorMessage
            ? html`
          <div class="mt-1 text-xs text-red-500">
            ${this.errorMessage}
          </div>
        `
            : ''
        }
      </div>
    `
  }

  public static override styles = css`@unocss-placeholder`
}

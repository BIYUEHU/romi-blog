import { LitElement, html, css } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'
import '../Tag'
import { getUniqueID } from '../../utils'

type RenderTagFunction = (tag: string, index: number) => unknown

@customElement('r-dynamic-tags')
export default class RDynamicTags extends LitElement {
  @property({ type: Array }) public modelValue: string[] = []
  @property({ type: Number }) public max = 10
  @property({ type: Function }) public renderTag?: RenderTagFunction
  @property({ type: Boolean }) public closeable = true

  @query('#tag-input') private newTagInputRef!: HTMLInputElement

  @state() private newTag = ''
  @state() private typing = false

  private uid = `'dynamic-tag-'${getUniqueID()}`

  private clickAdd() {
    this.typing = true
    setTimeout(() => this.newTagInputRef?.focus(), 0)
  }

  private removeTag(tag: string) {
    this.modelValue = this.modelValue.filter((item) => item !== tag)
    this.emitUpdate()
  }

  private addTag(e: Event) {
    const target = e.target as HTMLInputElement
    const value = target.value.trim()

    if (value) {
      this.modelValue = [...this.modelValue, value]
      this.emitUpdate()
    }

    this.deactive()
  }

  private deactive() {
    this.newTag = ''
    this.typing = false
  }

  private emitUpdate() {
    this.dispatchEvent(
      new CustomEvent('update:modelValue', {
        detail: this.modelValue,
        bubbles: true,
        composed: true
      })
    )
  }

  protected render() {
    return html`
      <div class="flex flex-wrap items-center">
        ${
          this.renderTag !== undefined
            ? this.modelValue.map(
                (tag, index) => html`
              <div class="mr-2">
                ${this.renderTag?.(tag, index)}
              </div>
            `
              )
            : this.modelValue.map(
                (tag) => html`
              <r-tag
                key=${tag}
                class="mr-2"
                ?closeable=${this.closeable}
                @close=${() => this.removeTag(tag)}
              >
                ${tag}
              </r-tag>
            `
              )
        }

        ${
          this.typing
            ? html`
            <slot
              name="input"
              .submit=${this.addTag}
              .deactive=${this.deactive}
            >
              <r-tag>
                <div class="relative h-4 min-w-7">
                  <input
                    id=${this.uid}
                    type="text"
                    .value=${this.newTag}
                    @input=${(e: Event) => {
                      this.newTag = (e.target as HTMLInputElement).value
                    }}
                    class="
                      absolute inline h-full w-full
                      border-none bg-transparent text-gray-500
                      outline-transparent focus:outline-none
                    "
                    @blur=${this.addTag}
                    @keyup=${(e: KeyboardEvent) => {
                      if (e.key === 'Enter') {
                        this.newTagInputRef.blur()
                      }
                    }}
                  >
                  <label 
                    for=${this.uid}
                    class="invisible"
                  >
                    ${this.newTag}
                  </label>
                </div>
              </r-tag>
            </slot>
          `
            : ''
        }

        ${
          this.modelValue.length < this.max && !this.typing
            ? html`
            <span 
              class="cursor-pointer"
              @click=${this.clickAdd}
            >
              <slot name="trigger">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="21"
                  height="21"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="#888888"
                    d="M11 17h2v-4h4v-2h-4V7h-2v4H7v2h4v4Zm1 5q-2.075 0-3.9-.788t-3.175-2.137q-1.35-1.35-2.137-3.175T2 12q0-2.075.788-3.9t2.137-3.175q1.35-1.35 3.175-2.137T12 2q2.075 0 3.9.788t3.175 2.137q1.35 1.35 2.138 3.175T22 12q0 2.075-.788 3.9t-2.137 3.175q-1.35 1.35-3.175 2.138T12 22Zm0-2q3.35 0 5.675-2.325T20 12q0-3.35-2.325-5.675T12 4Q8.65 4 6.325 6.325T4 12q0 3.35 2.325 5.675T12 20Zm0-8Z"
                  />
                </svg>
              </slot>
            </span>
          `
            : ''
        }
      </div>
    `
  }

  static styles = css`@unocss-placeholder`
}

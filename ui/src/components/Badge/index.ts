import { LitElement, html, css } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { Sizes, Types } from '../../preset'

@customElement('r-badge')
export default class RBadge extends LitElement {
  @property({ type: String }) public type: Types | 'default' = 'default'
  @property({ type: String }) public size: Exclude<Sizes, 'full'> = 'md'
  @property({ type: String }) public content = ''

  public render() {
    const classTag = `${RBadge.reflect[this.type]} absolute translate-x-1/2 rounded-full ${
      this.size === 'sm'
        ? 'text-[8px] p-[2px] -top-1 right-0'
        : this.size === 'md'
          ? 'px-1 py-0.5 text-xs -top-1/2 -right-1'
          : 'px-1.5 py-[3px] text-sm -top-1/3 -right-1/4'
    }`

    return html`
        <span class="relative cursor-default">
          <slot></slot>
          ${
            this.content
              ? html`
                <span class="${classTag}" style="line-height: 1;">${this.content}</span>
              `
              : html`
                <span class="${classTag} h-2 w-2 top-0.5 right-0"></span>
              `
          }
        </span>
    `
  }

  private static reflect: Record<Types | 'default', string> = {
    default: 'text-black bg-gray-100',
    primary: 'text-white bg-primary-500 bg-opacity-80',
    secondary: 'text-white bg-secondary-500',
    accent: 'text-white bg-accent-500',
    success: 'text-white bg-success-500',
    info: 'text-white bg-info-500',
    warning: 'text-white bg-warning-500',
    error: 'text-white bg-error-500'
  }

  public static styles = css`@unocss-placeholder`
}

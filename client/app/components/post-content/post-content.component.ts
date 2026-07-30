import { DatePipe, NgOptimizedImage } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnDestroy, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { DomSanitizer, SafeHtml } from '@angular/platform-browser'
import { RouterLink } from '@angular/router'
import { katex } from '@mdit/plugin-katex'
import markdownIt from 'markdown-it'
import MarkdownIt from 'markdown-it'
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import { BundledLanguage, BundledTheme, HighlighterGeneric } from 'shiki'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'
import { ResCommentData, ResPostSingleData } from '../../models/api.model'
import { ApiService } from '../../services/api.service'
import { AuthService } from '../../services/auth.service'
import { BrowserService } from '../../services/browser.service'
import { HighlighterService } from '../../services/highlighter.service'
import { LoggerService } from '../../services/logger.service'
import { NotifyService } from '../../services/notify.service'
import { STORE_KEYS, StoreService } from '../../services/store.service'
import { MessageBoxType } from '../../shared/types'
import { showErr } from '../../shared/utils'
import { SkeletonLoaderComponent } from '../skeleton-loader/skeleton-loader.component'

interface TocItem {
  level: number
  text: string
}

interface CommentItem extends ResCommentData {
  replyTo?: string
  replies?: CommentItem[]
}

@Component({
  selector: 'app-post-content',
  imports: [
    RouterLink,
    DatePipe,
    FormsModule,
    WebComponentInputAccessorDirective,
    NgOptimizedImage,
    SkeletonLoaderComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './post-content.component.html'
})
class PostContentComponent implements OnInit, OnDestroy {
  @Input({ required: true }) public post!: ResPostSingleData
  @Input() public password = false
  @Input() public hideToc = false
  @Input() public hideComments = false
  @Input() public hideRelatedPosts = false
  @Input() public hideOptions = false
  @Input() public hideCopyright = false
  // @Input() public setTitle = false

  private viewedTimeoutId?: number
  private mdParser?: MarkdownIt
  private highlighter?: HighlighterGeneric<BundledLanguage, BundledTheme>
  private readonly destroy$ = new Subject<void>()

  public renderedContent?: SafeHtml
  public commentText = ''
  public toc: TocItem[] = []
  public comments: CommentItem[] | null = null
  public replyingTo: { username: string; cid: number } | null = null
  public currentPage = 1
  public pageSize = 10

  public get pages() {
    return this.comments ? Array.from({ length: Math.ceil(this.comments.length / this.pageSize) }, (_, i) => i + 1) : []
  }

  public get pagedComments() {
    if (!this.comments) return []
    const start = (this.currentPage - 1) * this.pageSize
    return this.comments.slice(start, start + this.pageSize)
  }

  public extra?: { url: string; url2: string | null }

  public constructor(
    private readonly notifyService: NotifyService,
    private readonly apiService: ApiService,
    private readonly storeService: StoreService,
    private readonly sanitizer: DomSanitizer,
    private readonly highlighterService: HighlighterService,
    public readonly browserService: BrowserService,
    public readonly loggerService: LoggerService,
    public readonly authService: AuthService
  ) {}

  public ngOnInit() {
    this.mdParser = this.setupMdParser()

    this.renderContent().then(() =>
      this.browserService.on(() => {
        if (this.storeService.getItem(STORE_KEYS.postViewed(this.post.id))) return
        this.viewedTimeoutId = Number(
          setTimeout(
            () =>
              this.apiService
                .viewPost(this.post.id)
                .subscribe(() => this.storeService.setItem(STORE_KEYS.postViewed(this.post.id), true)),
            5000
          )
        )
      })
    )

    if (this.hideComments) {
      this.comments = []
    } else {
      this.apiService
        .getCommentsByPost(this.post.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe((comments) => {
          this.comments = this.parseComments(comments)
        })
    }
  }

  public ngOnDestroy() {
    if (this.viewedTimeoutId) clearTimeout(this.viewedTimeoutId)
  }

  public goToPage(page: number) {
    this.currentPage = page
  }

  public donate() {
    this.notifyService.showMessage('还没有开通啦~', MessageBoxType.Secondary)
  }

  public likePost() {
    if (this.storeService.getItem(STORE_KEYS.postLiked(this.post.id))) {
      this.notifyService.showMessage('已经点过赞了', MessageBoxType.Warning)
      return
    }
    this.apiService.likePost(this.post.id).subscribe(() => {
      this.storeService.setItem(STORE_KEYS.postLiked(this.post.id), true)
      this.post.likes += 1
      this.notifyService.showMessage('点赞成功', MessageBoxType.Success)
    })
  }

  public async sharePost() {
    const copyText = `${this.post?.title} - ${this.extra?.url}`
    try {
      await navigator.clipboard.writeText(copyText)
      this.notifyService.showMessage('链接已复制到剪贴板', MessageBoxType.Success)
    } catch (_) {
      this.notifyService.showMessage('链接复制失败', MessageBoxType.Error)
    }
  }

  public decryptPost() {
    if (!this.post.password) {
      this.notifyService.showMessage('文章未加密')
      return
    }
    const password = prompt('请输入密码', this.post.password === 'password' ? undefined : this.post.password)?.trim()
    if (password === void 0) return
    if (password === '') {
      this.notifyService.showMessage('密码不能为空', MessageBoxType.Warning)
      return
    }
    this.apiService
      .decryptPost(this.post.id, { password })
      .pipe()
      .subscribe({
        error: (data) => {
          this.loggerService.error('Decrypto error', data)
          this.notifyService.showMessage(`解密失败，意外的错误：${showErr(data)}`, MessageBoxType.Error)
        },
        next: (data) => {
          if (data) {
            this.post.text = data.text
            this.post.languages = data.languages
            this.post.password = null
            this.renderContent(true)
              .then(() => {
                this.notifyService.showMessage('解密成功', MessageBoxType.Success)
              })
              .catch((err) => {
                this.loggerService.error('Rerender to fail', err)
                this.notifyService.showMessage(`重渲染失败：${showErr(err)}`, MessageBoxType.Error)
              })
          } else {
            this.notifyService.showMessage('密码错误', MessageBoxType.Error)
          }
        }
      })
  }

  public async addComment() {
    if (!this.commentText) return

    this.apiService
      .sendComment(
        this.post.id,
        this.replyingTo ? `@${this.replyingTo.username}#${this.replyingTo.cid} ${this.commentText}` : this.commentText
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.apiService
          .getCommentsByPost(this.post.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe((comments) => {
            this.comments = this.parseComments(comments)
            this.commentText = ''
            this.replyingTo = null
          })
      })
  }

  public setReplyTo(username: string, cid: number) {
    this.replyingTo = { username, cid }
  }

  public cancelReply() {
    this.replyingTo = null
  }

  private setupMdParser() {
    const mdParser = markdownIt({
      html: true,
      linkify: true,
      typographer: true,
      highlight: (str: string, lang: string) => {
        try {
          if (!lang || !this.highlighter) return ''
          const langHandled = lang.toLowerCase()
          const loaded = this.highlighter.getLoadedLanguages()
          return this.highlighter.codeToHtml(str, {
            mergeWhitespaces: true,
            theme: 'vitesse-light',
            lang: loaded.includes(langHandled) ? langHandled : ''
          })
        } catch {
          return ''
        }
      }
    }).use(katex)
    const defaultHeadRender =
      mdParser.renderer.rules['heading_open'] ||
      ((tokens, idx, options, _, self) => self.renderToken(tokens, idx, options))

    mdParser.renderer.rules['heading_open'] = (tokens, idx, options, env, self) => {
      const token = tokens[idx]
      const next = tokens[idx + 1]
      if (next && next.type === 'inline') {
        token.attrSet('id', next.content)
      }
      return defaultHeadRender(tokens, idx, options, env, self)
    }

    mdParser.renderer.rules.image = (tokens, idx, _options, _env, _self) => {
      const token = tokens[idx]
      const src = token.attrGet('src') || ''
      const alt = token.content || ''
      return `<a href="${src}" target="_blank" class="romi-img inline-block hover:opacity-90 transition-opacity">
        <img src="${src}" alt="${alt}" class="max-w-full rounded-lg" loading="lazy">
      </a>`
    }

    return mdParser
  }

  private generateToc(content: string): TocItem[] {
    return [...content.matchAll(/^(#{1,6})\s+(.+)$/gm)].map((match) => ({
      level: match[1].length,
      text: match[2].trim()
    }))
  }

  private parseComments(comments: ResCommentData[]): CommentItem[] {
    return comments.map((comment) => {
      const replyMatch = comment.text.match(/^@(\w+)#(\d+)\s+(.+)/)
      if (replyMatch) {
        const [, username, , actualText] = replyMatch
        return {
          ...comment,
          replyTo: username,
          text: actualText
        }
      }
      return { ...comment }
    })
  }

  private async renderContent(force = false) {
    if (!this.highlighter || force) this.highlighter = await this.highlighterService.getHighlighter(this.post.languages)

    this.extra = {
      url: this.browserService.on(() => `${location.origin}/post/${this.post.id}`) ?? '',
      url2: this.post.strId ? this.browserService.on(() => `${location.origin}/post/${this.post.strId}`) : null
    }

    if (!this.mdParser) return

    const rawHtml = this.mdParser.render(this.post.text)
    this.renderedContent = this.sanitizer.bypassSecurityTrustHtml(rawHtml)

    if (!this.hideToc) this.toc = this.generateToc(this.post.text)
  }
}

export default PostContentComponent

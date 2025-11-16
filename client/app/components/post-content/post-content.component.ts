import { DatePipe } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnDestroy, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { DomSanitizer, SafeHtml } from '@angular/platform-browser'
import { Router, RouterLink } from '@angular/router'
import markdownIt from 'markdown-it'
import MarkdownIt from 'markdown-it'
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import { BundledLanguage, BundledTheme, HighlighterGeneric } from 'shiki'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'
import { ResCommentData, ResPostSingleData, UserAuthData } from '../../models/api.model'
import { ApiService } from '../../services/api.service'
import { AuthService } from '../../services/auth.service'
import { BrowserService } from '../../services/browser.service'
import { HighlighterService } from '../../services/highlighter.service'
import { NotifyService } from '../../services/notify.service'
import { KEYS } from '../../services/store.service'
import { randomRTagType } from '../../utils'
import { LoadingComponent } from '../loading/loading.component'

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
  standalone: true,
  imports: [LoadingComponent, RouterLink, DatePipe, FormsModule, WebComponentInputAccessorDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './post-content.component.html'
})
export class PostContentComponent implements OnInit, OnDestroy {
  @Input({ required: true }) public post!: ResPostSingleData
  @Input() public hideSubTitle = false
  @Input() public hideToc = false
  @Input() public hideComments = false
  @Input() public hideRelatedPosts = false
  @Input() public hideOptions = false
  @Input() public hideCopyright = false
  @Input() public setTitle = false
  // @Input() public defaultPostData?: ResPostSingleData

  private viewedTimeoutId?: number
  private mdParser?: MarkdownIt
  private highlighter?: HighlighterGeneric<BundledLanguage, BundledTheme>
  private destroy$ = new Subject<void>()

  public renderedContent: SafeHtml = ''
  public commentText = ''
  public toc: TocItem[] = []
  public comments: CommentItem[] = []
  public currentUser: UserAuthData | null = null
  public replyingTo: { username: string; cid: number } | null = null
  public currentPage = 1
  public pageSize = 10

  public get isNotLoggedIn() {
    return this.currentUser === null
  }

  public get pages() {
    return Array.from({ length: Math.ceil(this.comments.length / this.pageSize) }, (_, i) => i + 1)
  }

  public get pagedComments() {
    const start = (this.currentPage - 1) * this.pageSize
    return this.comments.slice(start, start + this.pageSize)
  }

  public extra?: { url: string; tags: [string, string][] }

  public constructor(
    private readonly router: Router,
    private readonly notifyService: NotifyService,
    private readonly authService: AuthService,
    private readonly apiService: ApiService,
    private readonly browserService: BrowserService,
    private readonly sanitizer: DomSanitizer,
    private readonly highlighterService: HighlighterService
  ) {}

  public ngOnInit() {
    this.mdParser = this.setupMdParser()

    this.authService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.currentUser = user
    })

    this.notifyService.setTitle(this.post.title)
    this.renderContent().then(() => this.viewPost())

    // TODO: 去掉 hideComments 由上游直接提供可选的评论数据决定是否显示
    if (this.hideComments) return
    this.apiService
      .getCommentsByPost(this.post.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((comments) => {
        this.comments = this.parseComments(comments)
      })
  }

  public ngOnDestroy() {
    if (this.viewedTimeoutId) clearTimeout(this.viewedTimeoutId)
  }

  public goToPage(page: number) {
    this.currentPage = page
  }

  public donate() {
    this.notifyService.showMessage('还没有开通啦~', 'secondary')
  }

  public viewPost() {
    if (!this.browserService.isBrowser || this.browserService.store?.getItem(KEYS.POST_VIEWED(this.post.id))) return
    this.viewedTimeoutId = Number(
      setTimeout(
        () =>
          this.apiService
            .viewPost(this.post.id)
            .subscribe(() => this.browserService.store?.setItem(KEYS.POST_VIEWED(this.post.id), true)),
        5000
      )
    )
  }

  public likePost() {
    if (this.browserService.store?.getItem(KEYS.POST_LIKED(this.post.id))) {
      this.notifyService.showMessage('已经点过赞了', 'warning')
      return
    }
    this.apiService.likePost(this.post.id).subscribe(() => {
      this.browserService.store?.setItem(KEYS.POST_LIKED(this.post.id), true)
      if (this.post) this.post.likes += 1
      this.updateHeaderContent()
      this.notifyService.showMessage('点赞成功', 'success')
    })
  }

  public async sharePost() {
    const copyText = `${this.post?.title} - ${this.extra?.url}`
    try {
      await navigator.clipboard.writeText(copyText)
      this.notifyService.showMessage('链接已复制到剪贴板', 'success')
    } catch (_) {
      this.notifyService.showMessage('链接复制失败', 'error')
    }
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
    })
    const defaultHeadRender =
      // biome-ignore lint: *
      mdParser.renderer.rules['heading_open'] ||
      ((tokens, idx, options, _, self) => self.renderToken(tokens, idx, options))

    // biome-ignore lint: *
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
    const headings = content.match(/#{1,6}.+/g) || []
    return headings.map((heading) => ({
      level: heading.match(/^#+/)?.[0].length || 0,
      text: heading.replace(/^#+\s*/, '')
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

  private updateHeaderContent() {
    const { post } = this
    if (!post) return
    this.notifyService.updateHeaderContent({
      title: post.title,
      subTitle: this.hideSubTitle
        ? []
        : [
            `创建时间：${new Date(post.created * 1000).toLocaleDateString()} | 更新时间：${new Date(
              post.modified * 1000
            ).toLocaleDateString()}`,
            `${post.views} 次阅读 ${post.allow_comment ? `•  ${post.comments} 条评论 ` : ''}•  ${post.likes} 人喜欢`
          ],
      ...(post.banner ? { imageUrl: post.banner } : {})
    })
  }

  private async renderContent() {
    if (!this.highlighter) this.highlighter = await this.highlighterService.getHighlighter(this.post.languages)

    this.extra = {
      url: ((ref) => (ref ? `${ref.location.origin}${this.router.url.split('#')[0]}` : ''))(
        this.browserService.windowRef
      ),
      tags: this.post.tags.map((tag) => [tag, randomRTagType()])
    }

    const rawHtml = this.mdParser!.render(this.post.text)
    this.renderedContent = this.sanitizer.bypassSecurityTrustHtml(rawHtml)

    if (!this.hideToc) this.toc = this.generateToc(this.post.text)
    this.updateHeaderContent()
  }
}

import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, OnDestroy, OnInit } from '@angular/core'
import { Router, RouterLink } from '@angular/router'
import { LoadingComponent } from '../../components/loading/loading.component'
import { RelatedPost, ResCommentData, ResPostSingleData, UserAuthData } from '../../models/api.model'
import { NotifyService } from '../../services/notify.service'
import { DatePipe } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'
import { AuthService } from '../../services/auth.service'
import markdownIt from 'markdown-it'
import { DomSanitizer, SafeHtml } from '@angular/platform-browser'
import { BundledLanguage, BundledTheme, HighlighterGeneric, createHighlighter } from 'shiki'
import { romiComponentFactory } from '../../utils/romi-component-factory'
import { SUPPORTS_HIGHLIGHT_LANGUAGES } from '../../shared/constants'

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
export class PostContentComponent
  extends romiComponentFactory<ResPostSingleData>('post-content')
  implements OnInit, OnDestroy
{
  @Input({ required: true }) public id!: number
  @Input() public hideSubTitle = false
  @Input() public hideToc = false
  @Input() public hideComments = false
  @Input() public hideRelatedPosts = false
  @Input() public hideOptions = false
  @Input() public hideCopyright = false

  public renderedContent: SafeHtml = ''

  private mdParser = new markdownIt({
    html: true,
    linkify: true,
    typographer: true,
    highlight: (str: string, lang: string) => {
      if (!lang || !this.highlighter) return ''
      const langHandled = lang.toLowerCase()
      return this.highlighter.codeToHtml(str, {
        mergeWhitespaces: true,
        theme: 'vitesse-light',
        lang: this.highlighter.getLoadedLanguages().includes(langHandled) ? langHandled : ''
      })
    }
  })

  private highlighter?: HighlighterGeneric<BundledLanguage, BundledTheme>

  public relatedPosts: [RelatedPost?, RelatedPost?] = []

  public commentText = ''

  public toc: TocItem[] = []
  public comments: CommentItem[] = []
  public currentUser?: UserAuthData | null
  public replyingTo: { username: string; cid: number } | null = null
  public get isNotLoggedIn() {
    return this.currentUser === null
  }

  public post?: Omit<ResPostSingleData, 'tags'> & { url: string; tags: [string, string][] }

  public currentPage = 1
  public pageSize = 10
  public get pages() {
    return Array.from({ length: Math.ceil(this.comments.length / this.pageSize) }, (_, i) => i + 1)
  }

  public constructor(
    private readonly router: Router,
    private readonly notifyService: NotifyService,
    private readonly authService: AuthService,
    private readonly sanitizer: DomSanitizer
  ) {
    super()
    if (this.hideComments || !this.browserService.isBrowser) return
    this.authService.user$.subscribe((user) => {
      this.currentUser = user
    })

    const defaultRender =
      // biome-ignore lint:
      this.mdParser.renderer.rules['heading_open'] ||
      ((tokens, idx, options, _, self) => self.renderToken(tokens, idx, options))

    // biome-ignore lint:
    this.mdParser.renderer.rules['heading_open'] = (tokens, idx, options, env, self) => {
      const token = tokens[idx]
      const nextToken = tokens[idx + 1]
      if (nextToken && nextToken.type === 'inline') {
        token.attrSet('id', nextToken.content)
      }
      return defaultRender(tokens, idx, options, env, self)
    }

    this.mdParser.renderer.rules.image = (tokens, idx, options, env, self) => {
      const token = tokens[idx]
      const src = token.attrGet('src') || ''
      const alt = token.content || ''
      return `<a href="${src}" target="_blank" class="romi-img inline-block hover:opacity-90 transition-opacity">
      <img src="${src}" alt="${alt}" class="max-w-full rounded-lg" loading="lazy">
    </a>`
    }
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
        const [_, username, __, actualText] = replyMatch
        return {
          ...comment,
          replyTo: username,
          text: actualText
        }
      }
      return { ...comment }
    })
  }

  private async renderContent(data: ResPostSingleData) {
    const highlighter = await createHighlighter({
      themes: ['vitesse-light'],
      langs: SUPPORTS_HIGHLIGHT_LANGUAGES
    })
    this.highlighter = highlighter
    this.post = {
      ...data,
      url: ((ref) => (ref ? `${ref.location.origin}${this.router.url.split('#')[0]}` : ''))(
        this.browserService.windowRef
      ),
      tags: data.tags.map((tag) => [
        tag,
        ((types) => types[Math.floor(Math.random() * types.length)])([
          'primary',
          'secondary',
          'accent',
          'success',
          'info',
          'warning',
          'error'
        ])
      ])
    }
    this.renderedContent = this.sanitizer.bypassSecurityTrustHtml(this.mdParser.render(data.text))

    if (!this.hideToc) this.toc = this.generateToc(data.text)
    this.notifyService.updateHeaderContent({
      title: data.title,
      subTitle: this.hideSubTitle
        ? []
        : [
            `创建时间：${new Date(data.created * 1000).toLocaleDateString()} | 更新时间：${new Date(data.modified * 1000).toLocaleDateString()}`,
            `${data.views} 次阅读 ${data.allow_comment ? `•  ${data.comments} 条评论 ` : ''}•  ${data.likes} 人喜欢`
          ],
      ...(data.banner ? { imageUrl: data.banner } : {})
    })
  }

  public goToPage(page: number) {
    this.currentPage = page
  }

  public get pagedComments() {
    const start = (this.currentPage - 1) * this.pageSize
    return this.comments.slice(start, start + this.pageSize)
  }

  public async ngOnInit() {
    this.setData(
      (set) => this.apiService.getPost(this.id).subscribe((data) => set(data)),
      (data) => this.renderContent(data)
    )
    this.apiService.getCommentsByPost(this.id).subscribe((comments) => {
      this.comments = this.parseComments(comments)
    })
    if (!this.hideRelatedPosts) {
      this.apiService.getPosts().subscribe((posts) => {
        const currentIndex = posts.findIndex((post) => post.id === this.id)
        this.relatedPosts =
          currentIndex === -1
            ? []
            : [
                currentIndex > 0
                  ? {
                      url: `/post/${posts[currentIndex - 1].id}`,
                      title: posts[currentIndex - 1].title,
                      type: 'prev'
                    }
                  : undefined,
                currentIndex < posts.length - 1
                  ? {
                      url: `/post/${posts[currentIndex + 1].id}`,
                      title: posts[currentIndex + 1].title,
                      type: 'next'
                    }
                  : undefined
              ]
      })
    }
  }

  public ngOnDestroy() {
    this.highlighter?.dispose()
  }

  public async likePost() {}

  public async addComment() {
    if (!this.commentText) return

    this.apiService
      .sendComment(
        this.id,
        this.replyingTo ? `@${this.replyingTo.username}#${this.replyingTo.cid} ${this.commentText}` : this.commentText
      )
      .subscribe(() => {
        this.apiService.getCommentsByPost(this.id).subscribe((comments) => {
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
}

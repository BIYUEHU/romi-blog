import { CUSTOM_ELEMENTS_SCHEMA, Component, EventEmitter, OnInit, Output } from '@angular/core'
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser'
import { ActivatedRoute, RouterLink } from '@angular/router'
import { ApiService } from '../../services/api.service'
import { LoadingComponent } from '../../components/loading/loading.component'
import MarkdownIt from 'markdown-it'
import { BundledLanguage, HighlighterGeneric, BundledTheme, createHighlighter } from 'shiki'
import { RelatedPost, ResPostSingleData, ResPostSingleDataExtra } from '../../models/api.model'
import { SUPPORTS_HIGHLIGHT_LANGUAGES } from '../../shared/constants'
import { NotifyService } from '../../services/notify.service'
import { APP_BASE_HREF, DatePipe } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { CacheService } from '../../services/cache.service'
import { WebComponentValueAccessorDirective } from '../../directives/web-component-value-accessor.directive'
import { BrowserService } from '../../services/browser.service'

@Component({
  selector: 'app-post',
  standalone: true,
  imports: [LoadingComponent, RouterLink, DatePipe, FormsModule, WebComponentValueAccessorDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './post.component.html'
})
export class PostComponent implements OnInit {
  public post: (ResPostSingleData & ResPostSingleDataExtra) | null = null
  public relatedPosts: RelatedPost[] = []

  public renderedContent: SafeHtml = ''

  public commentText = ''

  private mdParser: MarkdownIt
  private highlighter?: HighlighterGeneric<BundledLanguage, BundledTheme>

  public constructor(
    private readonly route: ActivatedRoute,
    private readonly apiService: ApiService,
    private readonly cacheService: CacheService,
    private readonly browserService: BrowserService,
    private readonly sanitizer: DomSanitizer,
    private readonly notifyService: NotifyService
  ) {
    this.mdParser = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      highlight: (str: string, lang: string) => {
        if (lang && this.highlighter) {
          const langHandled = lang.toLowerCase()
          return this.highlighter.codeToHtml(str, {
            mergeWhitespaces: true,
            theme: 'vitesse-light',
            lang: this.highlighter.getLoadedLanguages().includes(langHandled) ? langHandled : ''
          })
        }
        return ''
      }
    })
  }

  public async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')
    if (!id) return

    this.apiService.getPost(id).subscribe(async (post) => {
      this.notifyService.updateHeaderContent({
        title: post.title,
        subTitle: [
          `创建时间：${new Date(post.created * 1000).toLocaleDateString()} | 更新时间：${new Date(post.modified * 1000).toLocaleDateString()}`,
          `${post.views} 次阅读 •  ${post.comments} 条评论 •  ${post.likes} 人喜欢`
        ],
        ...(post.banner ? { imageUrl: post.banner } : {})
      })

      await this.loadSyntaxHighlighter()
      this.renderedContent = this.sanitizer.bypassSecurityTrustHtml(this.mdParser.render(post.text))
      const commentsList = this.cacheService.getCommentsList(Number(id))
      this.post = {
        ...post,
        url: ((ref) => (ref ? `${ref.location.origin}/post/${post.id}` : ''))(this.browserService.windowRef),
        commentsList,
        comments: commentsList.length
      }
    })

    this.cacheService.getRelatedPosts(Number(id)).subscribe((relatedPosts) => {
      this.relatedPosts = relatedPosts
    })
  }

  public async likePost() {}

  private async loadSyntaxHighlighter() {
    const highlighter = await createHighlighter({
      themes: ['vitesse-light'],
      langs: SUPPORTS_HIGHLIGHT_LANGUAGES
    })
    this.highlighter = highlighter
  }

  public async addComment() {
    if (!this.commentText) return
    console.log(this.commentText)
  }
}

import {
  CUSTOM_ELEMENTS_SCHEMA,
  Component,
  EventEmitter,
  OnInit,
  Output,
  TransferState,
  makeStateKey
} from '@angular/core'
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser'
import { ActivatedRoute, RouterLink } from '@angular/router'
import { LoadingComponent } from '../../components/loading/loading.component'
import MarkdownIt from 'markdown-it'
import { BundledLanguage, HighlighterGeneric, BundledTheme, createHighlighter } from 'shiki'
import { RelatedPost, ResPostSingleData, ResPostSingleDataExtra } from '../../models/api.model'
import { SUPPORTS_HIGHLIGHT_LANGUAGES } from '../../shared/constants'
import { NotifyService } from '../../services/notify.service'
import { DatePipe } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { CacheService } from '../../services/cache.service'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'
import { romiComponentFactory } from '../../utils/romi-component-factory'

@Component({
  selector: 'app-post',
  standalone: true,
  imports: [LoadingComponent, RouterLink, DatePipe, FormsModule, WebComponentInputAccessorDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './post.component.html'
})
export class PostComponent extends romiComponentFactory<ResPostSingleData>('post') {
  public post: (Omit<ResPostSingleData, 'tags'> & ResPostSingleDataExtra) | null = null

  public relatedPosts: [RelatedPost?, RelatedPost?] = []

  public renderedContent: SafeHtml = ''

  public commentText = ''

  private mdParser: MarkdownIt
  private highlighter?: HighlighterGeneric<BundledLanguage, BundledTheme>

  public constructor(
    private readonly route: ActivatedRoute,
    private readonly cacheService: CacheService,
    private readonly sanitizer: DomSanitizer,
    private readonly notifyService: NotifyService
  ) {
    super()
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

    this.setData(
      (set) => this.apiService.getPost(id).subscribe((data) => set(data)),
      (data) => {
        this.notifyService.updateHeaderContent({
          title: data.title,
          subTitle: [
            `创建时间：${new Date(data.created * 1000).toLocaleDateString()} | 更新时间：${new Date(data.modified * 1000).toLocaleDateString()}`,
            `${data.views} 次阅读 •  ${data.comments} 条评论 •  ${data.likes} 人喜欢`
          ],
          ...(data.banner ? { imageUrl: data.banner } : {})
        })

        this.loadSyntaxHighlighter().then(() => {
          this.renderedContent = this.sanitizer.bypassSecurityTrustHtml(this.mdParser.render(data.text))
          const commentsList = this.cacheService.getCommentsList(data.id)
          this.post = {
            ...data,
            url: ((ref) => (ref ? `${ref.location.origin}/post/${data.id}` : ''))(this.browserService.windowRef),
            commentsList,
            comments: commentsList.length,
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
        })
      }
    )
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
  }
}

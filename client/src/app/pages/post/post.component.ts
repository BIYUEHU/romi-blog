import { Component, EventEmitter, OnInit, Output } from '@angular/core'
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser'
import { ActivatedRoute } from '@angular/router'
import { ApiService } from '../../services/api.service'
import { LoadingComponent } from '../../loading/loading.component'
import MarkdownIt from 'markdown-it'
import { BundledLanguage, HighlighterGeneric, BundledTheme, createHighlighter } from 'shiki'
import { ResPostSingleData } from '../../models/api.model'
import { SUPPORTS_HIGHLIGHT_LANGUAGES } from '../../shared/constants'
import { NotifyService } from '../../services/notify.service'

@Component({
  selector: 'app-post',
  standalone: true,
  imports: [LoadingComponent],
  templateUrl: './post.component.html'
})
export class PostComponent implements OnInit {
  public post: (ResPostSingleData & { url: string }) | null = null
  public renderedContent: SafeHtml = ''

  private mdParser: MarkdownIt
  private highlighter?: HighlighterGeneric<BundledLanguage, BundledTheme>

  public constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private sanitizer: DomSanitizer,
    private notifyService: NotifyService
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

  async ngOnInit() {
    this.handlePost()
  }

  private handlePost() {
    const id = this.route.snapshot.paramMap.get('id')
    if (id) {
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
        this.post = { ...post, url: `${window.location.origin}/post/${post.id}` }
      })
    }
  }

  private async loadSyntaxHighlighter() {
    const highlighter = await createHighlighter({
      themes: ['vitesse-light'],
      langs: SUPPORTS_HIGHLIGHT_LANGUAGES
    })
    this.highlighter = highlighter
  }
}

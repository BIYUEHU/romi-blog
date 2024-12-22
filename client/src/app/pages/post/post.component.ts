import { Component, OnInit } from '@angular/core'
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser'
import { ActivatedRoute } from '@angular/router'
import { BlogService } from '../../services/blog.service'
import { DatePipe } from '@angular/common'
import { LoadingComponent } from '../../loading/loading.component'
import MarkdownIt from 'markdown-it'
import { BundledLanguage, HighlighterGeneric, BundledTheme, createHighlighter } from 'shiki'
import { ResPostSingleData } from '../../models/blog.model'

@Component({
  selector: 'app-post',
  standalone: true,
  imports: [DatePipe, LoadingComponent],
  templateUrl: './post.component.html'
})
export class PostComponent implements OnInit {
  public post: ResPostSingleData | null = null
  public renderedContent: SafeHtml = ''
  private mdParser: MarkdownIt

  private highlighter?: HighlighterGeneric<BundledLanguage, BundledTheme>

  constructor(
    private route: ActivatedRoute,
    private blogService: BlogService,
    private sanitizer: DomSanitizer
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
    const id = this.route.snapshot.paramMap.get('id')
    if (id) {
      this.blogService.getPost(id).subscribe(async (post) => {
        this.post = post
        await this.loadSyntaxHighlighter()
        this.renderedContent = this.sanitizer.bypassSecurityTrustHtml(this.mdParser.render(post.text))
      })
    }
  }

  private async loadSyntaxHighlighter() {
    const highlighter = await createHighlighter({
      themes: ['vitesse-light'],
      langs: ['typescript', 'json', 'yaml', 'javascript', 'markdown']
    })
    this.highlighter = highlighter
  }
}

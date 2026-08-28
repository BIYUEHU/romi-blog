import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core'
import { Meta } from '@angular/platform-browser'
import { pipe } from 'fp-ts/function'
import { ResPostSingleData } from '../../../output'
import PostContentComponent from '../../components/post-content/post-content.component'
import { SkeletonLoaderComponent } from '../../components/skeleton-loader/skeleton-loader.component'
import { ApiService } from '../../services/api.service'
import { BrowserService } from '../../services/browser.service'
import { AppTitleStrategy } from '../../shared/title-strategy'
import { formatDate } from '../../shared/utils'

@Component({
  selector: 'app-post',
  imports: [PostContentComponent, SkeletonLoaderComponent],
  templateUrl: './post.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class PostComponent implements OnInit, OnChanges {
  @Input() public readonly id!: string
  public post?: ResPostSingleData

  public constructor(
    private readonly apiService: ApiService,
    private readonly appTitleStrategy: AppTitleStrategy,
    private readonly browserService: BrowserService,
    private readonly meta: Meta
  ) {}

  public ngOnInit() {
    this.loadPost()
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes['id'] && !changes['id'].firstChange) this.loadPost()
  }

  private loadPost() {
    if (!this.browserService.is) return
    this.post = void 0
    pipe(+this.id, (id) =>
      Number.isNaN(id) ? this.apiService.getPostByStrId(this.id) : this.apiService.getPost(id)
    ).subscribe((post) => {
      this.post = { ...post, text: post.password ? '文章已加密' : post.text }
      this.appTitleStrategy.setTitle(post.title)
      this.meta.updateTag({ name: 'keywords', content: [post.categories, ...post.tags].join(',') })
      this.meta.updateTag({ name: 'description', content: post.text.slice(0, 150) })
      this.appTitleStrategy.updateHeader({
        title: post.title,
        subTitle: [
          `创建时间：${formatDate(new Date(post.created * 1000))}`,
          `更新时间：${formatDate(new Date(post.modified * 1000))}`,
          `${post.views} 次阅读 ${post.allowComment ? `•  ${post.comments} 条评论 ` : ''}•  ${post.likes} 人喜欢`
        ],
        ...(post.banner ? { imageUrl: post.banner } : {})
      })
    })
  }
}

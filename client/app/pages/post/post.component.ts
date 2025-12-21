import { Component, Input, OnInit } from '@angular/core'
import { ResPostSingleData } from '../../../output'
import { PostContentComponent } from '../../components/post-content/post-content.component'
import { SkeletonLoaderComponent } from '../../components/skeleton-loader/skeleton-loader.component'
import { ApiService } from '../../services/api.service'
import { AppTitleStrategy } from '../../shared/title-strategy'
import { formatDate } from '../../utils'

@Component({
  selector: 'app-post',
  imports: [PostContentComponent, SkeletonLoaderComponent],
  templateUrl: './post.component.html'
})
export class PostComponent implements OnInit {
  @Input() public readonly id!: string
  public post?: ResPostSingleData

  public constructor(
    private readonly apiService: ApiService,
    private readonly appTitleStrategy: AppTitleStrategy
  ) {}

  public ngOnInit() {
    this.apiService.getPost(+this.id).subscribe((post) => {
      this.post = post
      this.appTitleStrategy.setTitle(post.title)
      this.appTitleStrategy.updateHeader({
        title: post.title,
        subTitle: [
          `创建时间：${formatDate(new Date(post.created * 1000))} | 更新时间：${formatDate(
            new Date(post.modified * 1000)
          )}`,
          `${post.views} 次阅读 ${post.allow_comment ? `•  ${post.comments} 条评论 ` : ''}•  ${post.likes} 人喜欢`
        ],
        ...(post.banner ? { imageUrl: post.banner } : {})
      })
    })
  }
}

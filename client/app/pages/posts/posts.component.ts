import { Component, Input, type OnInit } from '@angular/core'
import { ResPostData } from '../../../output'
import { PostListComponent } from '../../components/post-list/post-list.component'
import { LayoutService } from '../../services/layout.service'
import { sortByCreatedTime } from '../../utils'

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [PostListComponent],
  template: `<app-post-list  [posts]="posts" />`
})
export class PostsComponent implements OnInit {
  @Input() public posts!: ResPostData[]

  public constructor(private readonly layoutService: LayoutService) {}

  public ngOnInit(): void {
    this.layoutService.setTitle('文章列表')
    this.layoutService.updateHeader({ title: '文章列表', subTitle: [] })
    this.posts = sortByCreatedTime(this.posts).map((post) =>
      post.password === 'password' ? { ...post, summary: '文章已加密' } : post
    )
  }
}

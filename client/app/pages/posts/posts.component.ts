import { Component, Input, type OnInit } from '@angular/core'
import { map } from 'rxjs'
import { ResPostData, ResPostSingleData } from '../../../output'
import { PostListComponent } from '../../components/post-list/post-list.component'
import { NotifyService } from '../../services/notify.service'
import { sortByCreatedTime } from '../../utils'

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [PostListComponent],
  template: `<app-post-list  [posts]="posts" />`
})
export class PostsComponent implements OnInit {
  @Input() public posts!: ResPostData[]

  public constructor(private readonly notifyService: NotifyService) {}

  public ngOnInit(): void {
    this.notifyService.setTitle('文章列表')
    this.notifyService.updateHeaderContent({ title: '文章列表', subTitle: [] })
    this.posts = sortByCreatedTime(this.posts).map((post) =>
      post.password === 'password' ? { ...post, summary: '文章已加密' } : post
    )
  }
}

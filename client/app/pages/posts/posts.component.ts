import { Component, Input, type OnInit } from '@angular/core'
import { ResPostData } from '../../../output'
import { PostListComponent } from '../../components/post-list/post-list.component'
import { sortByCreatedTime } from '../../utils'

@Component({
  selector: 'app-posts',
  imports: [PostListComponent],
  template: `<app-post-list  [posts]="posts" />`
})
export class PostsComponent implements OnInit {
  @Input() public posts!: ResPostData[]

  public ngOnInit() {
    this.posts = sortByCreatedTime(this.posts).map((post) =>
      post.password ? { ...post, summary: '文章已加密' } : post
    )
  }
}

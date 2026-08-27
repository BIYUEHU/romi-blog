import { Component, Input } from '@angular/core'
import { ResPostData } from '../../../output'
import { PostListComponent } from '../../components/post-list/post-list.component'

@Component({
  selector: 'app-posts',
  imports: [PostListComponent],
  template: `<app-post-list  [posts]="posts" />`
})
export class PostsComponent {
  @Input() public posts!: ResPostData[]
}

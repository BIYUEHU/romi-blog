import { Component, Input } from '@angular/core'
import { ResPostData } from '../../../output'
import { PostListComponent } from '../../components/post-list/post-list.component'

@Component({
  selector: 'app-tag',
  imports: [PostListComponent],
  template: `<app-post-list [posts]="posts" />`
})
export class TagComponent {
  @Input() public readonly tag!: string
  @Input() public posts!: ResPostData[]
}

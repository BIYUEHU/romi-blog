import { Component, Input } from '@angular/core'
import { ResPostData } from '../../../output'
import { PostListComponent } from '../../components/post-list/post-list.component'

@Component({
  selector: 'app-category',
  imports: [PostListComponent],
  template: `<app-post-list [posts]="posts" />`
})
export class CategoryComponent {
  @Input() public readonly category!: string
  @Input() public posts!: ResPostData[]
}

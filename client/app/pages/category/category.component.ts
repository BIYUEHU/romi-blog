import { Component, Input, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { ResPostData } from '../../../output'
import { PostListComponent } from '../../components/post-list/post-list.component'

@Component({
  selector: 'app-category',
  imports: [PostListComponent],
  template: `<app-post-list [posts]="posts" />`
})
export class CategoryComponent implements OnInit {
  @Input() public readonly category!: string
  @Input() public posts!: ResPostData[]

  public constructor(private readonly router: Router) {}

  public ngOnInit() {
    this.posts = this.posts.filter((post) => post.categories.includes(this.category))
    if (this.posts.length === 0) this.router.navigate(['/404'])
  }
}

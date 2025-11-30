import { Component, Input, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { ResPostData } from '../../../output'
import { PostListComponent } from '../../components/post-list/post-list.component'

@Component({
  selector: 'app-tag',
  imports: [PostListComponent],
  template: `<app-post-list [posts]="posts" />`
})
export class TagComponent implements OnInit {
  @Input() public readonly tag!: string
  @Input() public posts!: ResPostData[]

  public constructor(private readonly router: Router) {}

  public ngOnInit() {
    this.posts = this.posts.filter((post) => post.tags.includes(this.tag))
    if (this.posts.length === 0) this.router.navigate(['/404'])
  }
}

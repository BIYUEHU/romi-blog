import { Component, Input, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { ResPostData } from '../../../output'
import { PostListComponent } from '../../components/post-list/post-list.component'
import { LayoutService } from '../../services/layout.service'
import { sortByCreatedTime } from '../../utils'

@Component({
    selector: 'app-category',
    imports: [PostListComponent],
    template: `<app-post-list [posts]="posts" />`
})
export class CategoryComponent implements OnInit {
  @Input() public readonly name!: string
  @Input() public posts!: ResPostData[]

  public categoryName = ''

  public constructor(
    private readonly router: Router,
    private readonly layoutService: LayoutService
  ) {}

  public ngOnInit() {
    this.posts = sortByCreatedTime(this.posts).filter((post) => post.categories.includes(this.name))

    if (this.posts.length === 0) {
      this.router.navigate(['/404'])
      return
    }

    this.layoutService.setTitle(`${this.name} 分类`)
    this.layoutService.updateHeader({
      title: this.categoryName,
      subTitle: [`共 ${this.posts?.length ?? 0} 篇文章`]
    })
  }
}

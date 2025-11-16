import { Component, Input, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { ResPostData } from '../../../output'
import { PostListComponent } from '../../components/post-list/post-list.component'
import { NotifyService } from '../../services/notify.service'
import { sortByCreatedTime } from '../../utils'

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [PostListComponent],
  template: `<app-post-list [posts]="posts" />`
})
export class CategoryComponent implements OnInit {
  @Input() public readonly name!: string
  @Input() public posts!: ResPostData[]

  public categoryName = ''

  public constructor(
    private readonly router: Router,
    private readonly notifyService: NotifyService
  ) {}

  public ngOnInit() {
    this.posts = sortByCreatedTime(this.posts).filter((post) => post.categories.includes(this.name))

    if (this.posts.length === 0) {
      this.router.navigate(['/404']).then(() => {})
      return
    }

    this.notifyService.setTitle(`${this.name} 分类`)
    this.notifyService.updateHeaderContent({
      title: this.categoryName,
      subTitle: [`共 ${this.posts?.length ?? 0} 篇文章`]
    })
  }
}

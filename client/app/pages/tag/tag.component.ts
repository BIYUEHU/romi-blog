import { Component, Input, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { ResPostData } from '../../../output'
import { PostListComponent } from '../../components/post-list/post-list.component'
import { ApiService } from '../../services/api.service'
import { NotifyService } from '../../services/notify.service'

@Component({
  selector: 'app-tag',
  standalone: true,
  imports: [PostListComponent],
  template: `<app-post-list [posts]="posts" />`
})
export class TagComponent implements OnInit {
  @Input() public readonly name!: string
  @Input() public posts!: ResPostData[]

  public constructor(
    private readonly router: Router,
    private readonly notifyService: NotifyService
  ) {}

  public ngOnInit() {
    this.posts = this.posts.filter((post) => post.tags.includes(this.name))

    if (this.posts.length === 0) {
      this.router.navigate(['/404'])
      return
    }
    this.notifyService.setTitle(`${this.name} 标签`)
    this.notifyService.updateHeaderContent({
      title: `#${this.name}`,
      subTitle: [`共 ${this.posts.length} 篇文章`]
    })
  }
}

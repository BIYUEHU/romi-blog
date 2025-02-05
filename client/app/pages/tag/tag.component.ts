import { Component, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { ApiService } from '../../services/api.service'
import { ResPostData } from '../../models/api.model'
import { PostListComponent } from '../../components/post-list/post-list.component'
import { NotifyService } from '../../services/notify.service'

@Component({
  selector: 'app-tag',
  standalone: true,
  imports: [PostListComponent],
  template: `<app-post-list [posts]="posts" />`
})
export class TagComponent implements OnInit {
  public posts?: ResPostData[]
  public tagName = ''

  public constructor(
    private readonly route: ActivatedRoute,
    private readonly apiService: ApiService,
    private readonly notifyService: NotifyService
  ) {}

  public ngOnInit() {
    this.tagName = this.route.snapshot.paramMap.get('name') ?? ''
    if (!this.tagName) return

    this.apiService.getPosts().subscribe((posts) => {
      this.posts = posts.filter((post) => post.tags.includes(this.tagName))
      console.log(this.posts)

      this.notifyService.updateHeaderContent({
        title: `#${this.tagName}`,
        subTitle: [`共 ${this.posts.length} 篇文章`]
      })
    })
  }
}

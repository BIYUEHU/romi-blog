import { AfterViewInit, Component, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { ApiService } from '../../services/api.service'
import { ResPostData } from '../../models/api.model'
import { PostListComponent } from '../../components/post-list/post-list.component'
import { NotifyService } from '../../services/notify.service'

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [PostListComponent],
  template: `<app-post-list [posts]="posts" />`
})
export class CategoryComponent implements OnInit {
  public posts?: ResPostData[]
  public categoryName = ''

  public constructor(
    private readonly route: ActivatedRoute,
    private readonly apiService: ApiService,
    private readonly notifyService: NotifyService
  ) {}

  public ngOnInit() {
    this.categoryName = this.route.snapshot.paramMap.get('name') ?? ''
    if (!this.categoryName) return

    this.apiService.getPosts().subscribe((posts) => {
      this.posts = posts.filter((post) => post.categories.includes(this.categoryName))
      this.notifyService.updateHeaderContent({
        title: this.categoryName,
        subTitle: [`共 ${this.posts?.length ?? 0} 篇文章`]
      })
    })
  }
}

import { Component, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { map } from 'rxjs'
import { PostListComponent } from '../../components/post-list/post-list.component'
import { ResPostData } from '../../models/api.model'
import { NotifyService } from '../../services/notify.service'
import { sortByCreatedTime } from '../../utils'
import { romiComponentFactory } from '../../utils/romi-component-factory'

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [PostListComponent],
  template: `<app-post-list [posts]="data" />`
})
export class CategoryComponent extends romiComponentFactory<ResPostData[]>('home') implements OnInit {
  public categoryName = ''

  public constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly notifyService: NotifyService
  ) {
    super()
  }

  public ngOnInit() {
    this.categoryName = this.route.snapshot.paramMap.get('name') ?? ''
    if (!this.categoryName) return

    this.load(
      this.apiService
        .getPosts()
        .pipe(map((data) => sortByCreatedTime(data).filter((post) => post.categories.includes(this.categoryName)))),
      (data) => {
        if (data.length === 0) {
          this.router.navigate(['/404']).then(() => {})
          return
        }
        this.notifyService.setTitle(`${this.categoryName} 分类`)
        this.notifyService.updateHeaderContent({
          title: this.categoryName,
          subTitle: [`共 ${this.data?.length ?? 0} 篇文章`]
        })
      }
    )
  }
}

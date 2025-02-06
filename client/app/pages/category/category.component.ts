import { Component, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { ResPostData } from '../../models/api.model'
import { PostListComponent } from '../../components/post-list/post-list.component'
import { NotifyService } from '../../services/notify.service'
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
    private readonly notifyService: NotifyService
  ) {
    super()
  }

  public ngOnInit() {
    this.categoryName = this.route.snapshot.paramMap.get('name') ?? ''
    if (!this.categoryName) return

    this.setData(
      (set) => this.apiService.getPosts().subscribe((data) => set(data)),
      (data) => {
        this.data = data.filter((post) => post.categories.includes(this.categoryName))
        this.notifyService.updateHeaderContent({
          title: this.categoryName,
          subTitle: [`共 ${this.data?.length ?? 0} 篇文章`]
        })
      }
    )
  }
}

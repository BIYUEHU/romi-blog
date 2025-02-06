import { Component, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { ResPostData } from '../../models/api.model'
import { PostListComponent } from '../../components/post-list/post-list.component'
import { NotifyService } from '../../services/notify.service'
import { romiComponentFactory } from '../../utils/romi-component-factory'

@Component({
  selector: 'app-tag',
  standalone: true,
  imports: [PostListComponent],
  template: `<app-post-list [posts]="data" />`
})
export class TagComponent extends romiComponentFactory<ResPostData[]>('home') implements OnInit {
  public tagName = ''

  public constructor(
    private readonly route: ActivatedRoute,
    private readonly notifyService: NotifyService
  ) {
    super()
  }

  public ngOnInit() {
    this.tagName = this.route.snapshot.paramMap.get('name') ?? ''
    if (!this.tagName) return

    this.setData(
      (set) => this.apiService.getPosts().subscribe((data) => set(data)),
      (data) => {
        this.data = data.filter((post) => post.tags.includes(this.tagName))
        this.notifyService.updateHeaderContent({
          title: `#${this.tagName}`,
          subTitle: [`共 ${this.data.length} 篇文章`]
        })
      }
    )
  }
}

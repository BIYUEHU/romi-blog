import { Component, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { PostListComponent } from '../../components/post-list/post-list.component'
import { ResPostData } from '../../models/api.model'
import { NotifyService } from '../../services/notify.service'
import { sortByCreatedTime } from '../../utils'
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
    private readonly router: Router,
    private readonly notifyService: NotifyService
  ) {
    super()
  }

  public ngOnInit() {
    this.tagName = this.route.snapshot.paramMap.get('name') ?? ''
    if (!this.tagName) return

    this.setData(
      (set) => this.apiService.getPosts().subscribe((data) => set(sortByCreatedTime(data))),
      (data) => {
        this.data = data.filter((post) => post.tags.includes(this.tagName))
        if (this.data.length === 0) {
          this.router.navigate(['/404'])
          return
        }
        this.notifyService.setTitle(`${this.tagName} 标签`)
        this.notifyService.updateHeaderContent({
          title: `#${this.tagName}`,
          subTitle: [`共 ${this.data.length} 篇文章`]
        })
      }
    )
  }
}

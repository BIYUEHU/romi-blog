import { Component, type OnInit } from '@angular/core'
import { PostListComponent } from '../../components/post-list/post-list.component'
import { ResPostData } from '../../models/api.model'
import { NotifyService } from '../../services/notify.service'
import { handlePostList, sortByCreatedTime } from '../../utils'
import { romiComponentFactory } from '../../utils/romi-component-factory'

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [PostListComponent],
  template: `<app-post-list  [posts]="data" />`
})
export class PostsComponent extends romiComponentFactory<ResPostData[]>('posts') implements OnInit {
  public constructor(private readonly notifyService: NotifyService) {
    super()
    this.notifyService.setTitle('文章列表')
  }

  public ngOnInit(): void {
    this.notifyService.updateHeaderContent({ title: '文章列表', subTitle: [] })

    // TODO: handle posts and posts locked need auth but cache data cannot get
    this.setData((set) => this.apiService.getPosts().subscribe((data) => set(handlePostList(sortByCreatedTime(data)))))
  }
}

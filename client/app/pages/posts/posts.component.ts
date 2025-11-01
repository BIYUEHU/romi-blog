import { Component, type OnInit } from '@angular/core'
import { map } from 'rxjs'
import { PostListComponent } from '../../components/post-list/post-list.component'
import { ResPostData } from '../../models/api.model'
import { NotifyService } from '../../services/notify.service'
import { sortByCreatedTime } from '../../utils'
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
    this.load(
      this.apiService
        .getPosts()
        .pipe(
          map((data) =>
            sortByCreatedTime(data).map((post) =>
              post.password === 'password' ? { ...post, summary: '文章已加密' } : post
            )
          )
        )
    )
  }
}

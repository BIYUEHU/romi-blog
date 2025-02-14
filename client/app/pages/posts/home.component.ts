import { Component, type OnInit } from '@angular/core'
import { ResPostData } from '../../models/api.model'
import { PostListComponent } from '../../components/post-list/post-list.component'
import { romiComponentFactory } from '../../utils/romi-component-factory'
import { handlePostList, sortByCreatedTime } from '../../utils'

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [PostListComponent],
  template: `<app-post-list  [posts]="data" />`
})
export class PostsComponent extends romiComponentFactory<ResPostData[]>('posts') implements OnInit {
  public ngOnInit(): void {
    // TODO: handle posts and posts locked need auth but cache data cannot get
    this.setData((set) => this.apiService.getPosts().subscribe((data) => set(handlePostList(sortByCreatedTime(data)))))
  }
}

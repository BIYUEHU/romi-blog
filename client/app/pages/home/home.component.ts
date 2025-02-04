import { Component, type OnInit } from '@angular/core'
import { ApiService } from '../../services/api.service'
import { ResPostData } from '../../models/api.model'
import { CommonModule, DatePipe } from '@angular/common'
import { CacheService } from '../../services/cache.service'
import { PostListComponent } from '../../components/post-list/post-list.component'

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, PostListComponent],
  template: `<app-post-list  [posts]="posts" />`
})
export class HomeComponent implements OnInit {
  public posts?: ResPostData[]

  public constructor(
    private readonly apiService: ApiService,
    private readonly cacheService: CacheService
  ) {}

  public ngOnInit() {
    this.apiService.getPosts().subscribe((posts) => {
      this.posts = posts
      this.cacheService.setCacheData(posts)
    })
  }
}

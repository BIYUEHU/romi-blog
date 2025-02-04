import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit } from '@angular/core'
import { RouterLink } from '@angular/router'
import { LoadingComponent } from '../../components/loading/loading.component'
import { ApiService } from '../../services/api.service'
import { ReqMetaData, ResPostData } from '../../models/api.model'

@Component({
  selector: 'app-archive',
  standalone: true,
  imports: [LoadingComponent, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './archive.component.html'
})
export class ArchiveComponent implements OnInit {
  public tags: ReqMetaData[] = []
  public categories: ReqMetaData[] = []
  public posts: ResPostData[] = []
  public groupedPosts: [
    string,
    {
      date: string
      title: string
      id: number
    }[]
  ][] = []

  public constructor(private readonly apiService: ApiService) {}

  public async ngOnInit() {
    this.apiService.getMetas().subscribe((tags) => {
      this.tags = tags.filter(({ is_category }) => !is_category)
      this.categories = tags.filter(({ is_category }) => is_category)
    })

    this.apiService.getPosts().subscribe((posts) => {
      this.posts = posts
      this.groupPostsByYear()
    })
  }

  private groupPostsByYear() {
    this.groupedPosts = this.posts.reduce((acc, post) => {
      const date = new Date(post.created * 1000)
      const year = date.getFullYear().toString()
      let index = acc.findIndex(([target]) => target === year)
      index = index === -1 ? acc.push([year, []]) - 1 : index
      acc[index][1].push({
        date: `${((result) => (result > 10 ? result : `0${result}`))(date.getMonth() + 1)}-${((result) => (result > 10 ? result : `0${result}`))(date.getDate())}`,
        title: post.title,
        id: post.id
      })
      return acc
    }, this.groupedPosts)
  }
}

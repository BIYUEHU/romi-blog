import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit } from '@angular/core'
import { RouterLink } from '@angular/router'
import { LoadingComponent } from '../../components/loading/loading.component'
import { ResPostData } from '../../models/api.model'
import { romiComponentFactory } from '../../utils/romi-component-factory'
import { sortByCreatedTime } from '../../utils'

@Component({
  selector: 'app-archive',
  standalone: true,
  imports: [LoadingComponent, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './archive.component.html'
})
export class ArchiveComponent extends romiComponentFactory<ResPostData[]>('archive') implements OnInit {
  public groupedPosts: [
    string,
    {
      date: string
      title: string
      id: number
    }[]
  ][] = []

  public tags: string[] = []

  public categories: string[] = []

  public async ngOnInit() {
    this.setData(
      (set) => this.apiService.getPosts().subscribe((posts) => set(sortByCreatedTime(posts))),
      (posts) => {
        this.groupedPosts = posts.reduce((acc, post) => {
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
        // biome-ignore lint:
        this.tags = posts.reduce((acc, post) => Array.from(new Set([...acc, ...post.tags])), [] as string[])
        // biome-ignore lint:
        this.categories = posts.reduce((acc, post) => Array.from(new Set([...acc, ...post.categories])), [] as string[])
      }
    )
  }
}

import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit } from '@angular/core'
import { RouterLink } from '@angular/router'
import { LoadingComponent } from '../../components/loading/loading.component'
import { ResMetaData, ResPostData } from '../../models/api.model'
import { romiComponentFactory } from '../../utils/romi-component-factory'

@Component({
  selector: 'app-archive',
  standalone: true,
  imports: [LoadingComponent, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './archive.component.html'
})
export class ArchiveComponent
  extends romiComponentFactory<[ResPostData[], ResMetaData[], ResMetaData[]]>('archive')
  implements OnInit
{
  public groupedPosts: [
    string,
    {
      date: string
      title: string
      id: number
    }[]
  ][] = []

  public async ngOnInit() {
    this.setData(
      (set) =>
        Promise.all([
          new Promise<ResPostData[]>((resolve) => this.apiService.getPosts().subscribe((posts) => resolve(posts))),
          new Promise<ResMetaData[]>((resolve) => this.apiService.getMetas().subscribe((tags) => resolve(tags)))
        ]).then(([posts, metas]) =>
          set([posts, metas.filter(({ is_category }) => is_category), metas.filter(({ is_category }) => !is_category)])
        ),
      ([posts]) => {
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
      }
    )
  }
}

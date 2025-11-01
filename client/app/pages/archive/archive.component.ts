import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core'
import { RouterLink } from '@angular/router'
import { LoadingComponent } from '../../components/loading/loading.component'
import { ResPostData } from '../../models/api.model'
import { NotifyService } from '../../services/notify.service'
import { romiComponentFactory } from '../../utils/romi-component-factory'

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

  public constructor(private notifyService: NotifyService) {
    super()
    this.notifyService.setTitle('归档整理')
  }

  public async ngOnInit() {
    this.load(this.apiService.getPosts(), (posts) => {
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
      // biome-ignore lint: *
      this.tags = posts.reduce((acc, post) => Array.from(new Set([...acc, ...post.tags])), [] as string[])
      // biome-ignore lint: *
      this.categories = posts.reduce((acc, post) => Array.from(new Set([...acc, ...post.categories])), [] as string[])
    })
  }
}

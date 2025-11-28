import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnInit } from '@angular/core'
import { RouterLink } from '@angular/router'
import { ResPostData } from '../../models/api.model'
import { LayoutService } from '../../services/layout.service'

@Component({
    selector: 'app-archive',
    imports: [RouterLink],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './archive.component.html'
})
export class ArchiveComponent implements OnInit {
  @Input() public readonly posts!: ResPostData[]

  public archive: [
    string,
    {
      date: string
      title: string
      id: number
    }[]
  ][] = []

  public tags: string[] = []
  public categories: string[] = []

  public constructor(private readonly layoutService: LayoutService) {}

  public async ngOnInit() {
    this.layoutService.setTitle('归档整理')
    this.archive = this.posts.reduce((acc, post) => {
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
    }, this.archive)
    this.tags = this.posts.reduce((acc, post) => Array.from(new Set(acc.concat(post.tags))), [] as string[])
    this.categories = this.posts.reduce((acc, post) => Array.from(new Set(acc.concat(post.categories))), [] as string[])
  }
}

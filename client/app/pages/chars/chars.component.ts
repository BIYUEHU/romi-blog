import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { LoadingComponent } from '../../components/loading/loading.component'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'
import { ResCharacterData } from '../../models/api.model'
import { NotifyService } from '../../services/notify.service'

@Component({
  selector: 'app-chars',
  standalone: true,
  imports: [RouterLink, LoadingComponent, WebComponentInputAccessorDirective, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './chars.component.html'
})
export class CharsComponent implements OnInit {
  @Input() public chars!: ResCharacterData[]

  public searchQuery = ''

  public constructor(private readonly notifyService: NotifyService) {}

  public ngOnInit() {
    this.chars = this.chars.filter(({ hide }) => !hide).sort((a, b) => a.order - b.order)
    this.notifyService.setTitle('角色收藏')
    this.notifyService.updateHeaderContent({
      title: '角色收藏',
      subTitle: [`总计 ${this.chars.length} 位角色`, '这里收集了曾经历的故事中邂逅并令之心动的美少女角色~']
    })
  }

  public get filteredChars() {
    if (!this.searchQuery || !this.chars) {
      return this.chars ?? []
    }

    const query = this.searchQuery.toLowerCase()
    return this.chars.filter(
      (char) =>
        char.name.toLowerCase().includes(query) ||
        char.romaji.toLowerCase().includes(query) ||
        char.alias?.some((alias) => alias.toLowerCase().includes(query))
    )
  }
}

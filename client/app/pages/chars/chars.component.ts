import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { LoadingComponent } from '../../components/loading/loading.component'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'
import { ResCharacterData } from '../../models/api.model'
import { NotifyService } from '../../services/notify.service'
import { romiComponentFactory } from '../../utils/romi-component-factory'

@Component({
  selector: 'app-chars',
  standalone: true,
  imports: [RouterLink, LoadingComponent, WebComponentInputAccessorDirective, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './chars.component.html'
})
export class CharsComponent extends romiComponentFactory<ResCharacterData[]>('chars') implements OnInit {
  public isLoading = true

  public searchQuery = ''

  public constructor(private readonly notifyService: NotifyService) {
    super()
    this.notifyService.setTitle('角色收藏')
  }

  public ngOnInit() {
    this.loadData(this.apiService.getCharacters()).subscribe((data) => {
      this.isLoading = false
      this.data = data.filter(({ hide }) => !hide).sort((a, b) => a.order - b.order)
      this.notifyService.updateHeaderContent({
        title: '角色收藏',
        subTitle: [`总计 ${data.length} 位角色`, '这里收集了曾经历的故事中邂逅并令之心动的美少女角色~']
      })
    })
  }

  public get filteredChars() {
    if (!this.searchQuery || !this.data) {
      return this.data ?? []
    }

    const query = this.searchQuery.toLowerCase()
    return this.data.filter(
      (char) =>
        char.name.toLowerCase().includes(query) ||
        char.romaji.toLowerCase().includes(query) ||
        char.alias?.some((alias) => alias.toLowerCase().includes(query))
    )
  }
}

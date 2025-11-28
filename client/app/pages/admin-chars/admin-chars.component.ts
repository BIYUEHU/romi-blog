import {DatePipe, NgOptimizedImage} from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import {
  AbstractAdminBaseListComponent,
  AdminBaseListComponent
} from '../../components/admin-base-list/admin-base-list.component'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'
import { ResCharacterData } from '../../models/api.model'
import { ApiService } from '../../services/api.service'
import { renderCharacterBWH } from '../../utils'

@Component({
    selector: 'app-admin-chars',
    imports: [DatePipe, RouterLink, FormsModule, WebComponentInputAccessorDirective, AdminBaseListComponent, NgOptimizedImage],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './admin-chars.component.html'
})
export class AdminCharsComponent extends AbstractAdminBaseListComponent<ResCharacterData> implements OnInit {
  public constructor(private readonly apiService: ApiService) {
    super()
    this.layoutService.setTitle('角色管理')
    this.emptyMessage = '暂无角色'
  }

  protected loadItems(): void {
    this.isLoading = true
    this.apiService.getCharacters().subscribe((data) => {
      this.items = data.reverse().sort((a, b) => a.order - b.order)
      this.isLoading = false
    })
  }

  protected searchPredicate(character: ResCharacterData, query: string): boolean {
    return (
      character.name.toLowerCase().includes(query) ||
      character.alias.some((alias) => alias.toLowerCase().includes(query)) ||
      character.romaji.toLowerCase().includes(query)
    )
  }

  protected deleteItem(id: number): void {
    if (this.confirmDelete()) {
      this.apiService.deleteCharacter(id).subscribe(() => {
        this.layoutService.showMessage('角色删除成功', 'secondary')
        this.items = this.items.filter((character) => character.id !== id)
      })
    }
  }

  public ngOnInit(): void {
    this.loadItems()
  }

  public readonly renderBWH = renderCharacterBWH
}

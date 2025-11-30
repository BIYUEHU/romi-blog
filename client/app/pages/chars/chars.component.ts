import { NgOptimizedImage } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'
import { ResCharacterData } from '../../models/api.model'

@Component({
  selector: 'app-chars',
  imports: [RouterLink, WebComponentInputAccessorDirective, FormsModule, NgOptimizedImage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './chars.component.html'
})
export class CharsComponent implements OnInit {
  @Input() public chars!: ResCharacterData[]

  public searchQuery = ''

  public ngOnInit() {
    this.chars = this.chars.filter(({ hide }) => !hide).sort((a, b) => a.order - b.order)
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

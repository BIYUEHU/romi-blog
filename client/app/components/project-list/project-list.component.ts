import { DatePipe } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnInit } from '@angular/core'
import { LanguageColors, ResProjectData } from '../../models/api.model'
import { ApiService } from '../../services/api.service'
import { CardComponent } from '../card/card.component'

@Component({
  selector: 'app-project-list',
  imports: [DatePipe, CardComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './project-list.component.html'
})
export class ProjectListComponent implements OnInit {
  @Input({ required: true }) public repos!: ResProjectData[]

  public colors?: LanguageColors

  public defaultColor = '#6e7681'

  public constructor(private readonly apiService: ApiService) {}

  public ngOnInit(): void {
    this.apiService.getLanguageColors().subscribe((colors) => {
      this.colors = colors
    })
  }

  public windowOpen(url: string): void {
    window.open(url, '_blank')
  }
}

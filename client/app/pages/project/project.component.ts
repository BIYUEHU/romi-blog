import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ResProjectData } from '../../../output'
import { ProjectListComponent } from '../../components/project-list/project-list.component'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'

@Component({
  selector: 'app-project',
  imports: [FormsModule, WebComponentInputAccessorDirective, ProjectListComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './project.component.html'
})
export class ProjectComponent {
  @Input() public readonly projects!: ResProjectData[]

  public searchQuery = ''
  public selectedLanguage = ''

  public get filteredRepos() {
    let filtered = [...this.projects]

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase()
      filtered = filtered.filter(
        (repo) =>
          repo.name.toLowerCase().includes(query) ||
          repo.description?.toLowerCase().includes(query) ||
          repo.topics.some((topic) => topic.toLowerCase().includes(query))
      )
    }

    if (this.selectedLanguage) {
      filtered = filtered.filter((repo) => repo.language === this.selectedLanguage)
    }
    return filtered
  }

  public get languages(): string[] {
    return Array.from(new Set(this.projects.map((repo) => repo.language).filter(Boolean) as string[])).sort()
  }
}

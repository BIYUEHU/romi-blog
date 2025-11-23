import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ResProjectData } from '../../../output'
import { LoadingComponent } from '../../components/loading/loading.component'
import { ProjectListComponent } from '../../components/project-list/project-list.component'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'
import { LayoutService } from '../../services/layout.service'

@Component({
  selector: 'app-project',
  standalone: true,
  imports: [FormsModule, LoadingComponent, WebComponentInputAccessorDirective, ProjectListComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './project.component.html'
})
export class ProjectComponent implements OnInit {
  @Input() public readonly projects!: ResProjectData[]

  public searchQuery = ''
  public selectedLanguage = ''

  public constructor(private readonly layoutService: LayoutService) {
    this.layoutService.setTitle('开源项目')
  }

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

  public ngOnInit() {
    this.layoutService.updateHeader({
      title: '开源项目',
      subTitle: ['这里是我的一些开源作品，大部分都是练手或者实用的小工具']
    })
  }
}

import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit } from '@angular/core'
import { LoadingComponent } from '../../components/loading/loading.component'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'
import { romiComponentFactory } from '../../utils/romi-component-factory'
import { NotifyService } from '../../services/notify.service'
import { FormsModule } from '@angular/forms'
import { ProjectListComponent } from '../../components/project-list/project-list.component'
import { ResProjectData } from '../../models/api.model'

@Component({
  selector: 'app-project',
  standalone: true,
  imports: [FormsModule, LoadingComponent, WebComponentInputAccessorDirective, ProjectListComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './project.component.html'
})
export class ProjectComponent extends romiComponentFactory<ResProjectData[]>('project') implements OnInit {
  public isLoading = true

  public searchQuery = ''
  public selectedLanguage = ''

  public constructor(private readonly notifyService: NotifyService) {
    super()
  }

  public get filteredRepos() {
    if (!this.data) return []

    let filtered = [...this.data]

    // 搜索过滤
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase()
      filtered = filtered.filter(
        (repo) =>
          repo.name.toLowerCase().includes(query) ||
          repo.description?.toLowerCase().includes(query) ||
          repo.topics.some((topic) => topic.toLowerCase().includes(query))
      )
    }

    // 语言过滤
    if (this.selectedLanguage) {
      filtered = filtered.filter((repo) => repo.language === this.selectedLanguage)
    }
    return filtered
  }

  public get languages(): string[] {
    if (!this.data) return []
    const langs = new Set(this.data.map((repo) => repo.language).filter(Boolean) as string[])
    return Array.from(langs).sort()
  }

  public ngOnInit() {
    this.notifyService.updateHeaderContent({
      title: '开源项目',
      subTitle: ['这里是我的一些开源作品，大部分都是练手或者实用的小工具']
    })

    this.setData(
      (set) => this.apiService.getProjects().subscribe((data) => set(data)),
      () => {
        this.isLoading = false
      }
    )
  }
}

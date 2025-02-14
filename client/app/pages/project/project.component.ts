import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit } from '@angular/core'
import { DatePipe } from '@angular/common'
import { LoadingComponent } from '../../components/loading/loading.component'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'
import { romiComponentFactory } from '../../utils/romi-component-factory'
import { NotifyService } from '../../services/notify.service'
import { Repository } from '../../models/api.model'
import { FormsModule } from '@angular/forms'

@Component({
  selector: 'app-project',
  standalone: true,
  imports: [FormsModule, DatePipe, LoadingComponent, WebComponentInputAccessorDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './project.component.html'
})
export class ProjectComponent extends romiComponentFactory<Repository[]>('project') implements OnInit {
  public isLoading = true

  public searchQuery = ''
  public selectedLanguage = ''

  private readonly languageColors: Record<string, string> = {
    TypeScript: '#3178c6',
    JavaScript: '#f1e05a',
    Vue: '#41b883',
    Python: '#3572A5',
    Java: '#b07219',
    HTML: '#e34c26',
    CSS: '#563d7c',
    'C++': '#f34b7d',
    'C#': '#178600',
    Ruby: '#701516',
    Rust: '#dea584',
    Go: '#00ADD8',
    Swift: '#ffac45',
    PHP: '#4F5D95',
    Kotlin: '#F18E33',
    R: '#198CE7',
    Scala: '#c22d40',
    Elixir: '#6e4a7e',
    Elm: '#60B5CC',
    Clojure: '#db5855',
    Haskell: '#5e5086',
    Lua: '#000080',
    Julia: '#a270ba',
    Perl: '#0298c3',
    Erlang: '#B83998',
    Emacs: '#c065db',
    Vim: '#0196f3',
    ReScript: '#ed502e',
    ReasonML: '#ff5847',
    FSharp: '#b845fc',
    Idris: '#b30000',
    Zig: '#ec915c'
  }

  public constructor(private readonly notifyService: NotifyService) {
    super()
  }

  public getLanguageColor(language: string | null): string {
    if (!language) return '#6e7681'
    return this.languageColors[language] || '#6e7681'
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
      (data) => {
        this.isLoading = false
      }
    )
  }
}

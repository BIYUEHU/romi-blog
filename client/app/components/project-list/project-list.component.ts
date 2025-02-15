import { CUSTOM_ELEMENTS_SCHEMA, Component, Input } from '@angular/core'
import { Repository } from '../../models/api.model'
import { DatePipe } from '@angular/common'

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [DatePipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './project-list.component.html'
})
export class ProjectListComponent {
  @Input({ required: true }) public repos!: Repository[]

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

  public getLanguageColor(language: string | null): string {
    if (!language) return '#6e7681'
    return this.languageColors[language] || '#6e7681'
  }
}

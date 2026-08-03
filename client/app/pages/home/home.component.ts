import { DatePipe, NgOptimizedImage } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnDestroy, OnInit } from '@angular/core'
import { ResolveFn, RouterLink } from '@angular/router'
import { CardComponent } from '../../components/card/card.component'
import { LayoutComponent } from '../../components/layout/layout.component'
import { PostCardComponent } from '../../components/post-card/post-card.component'
import { ProjectListComponent } from '../../components/project-list/project-list.component'
import { ApiService } from '../../services/api.service'
import { BrowserService } from '../../services/browser.service'
import { APlayer } from '../../shared/types'
import { homeResolver } from './home.resolver'

@Component({
  selector: 'app-home',
  imports: [
    DatePipe,
    RouterLink,
    ProjectListComponent,
    CardComponent,
    LayoutComponent,
    NgOptimizedImage,
    PostCardComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit, OnDestroy {
  @Input() public readonly home!: typeof homeResolver extends ResolveFn<infer T> ? T : never

  private aplayer?: APlayer

  public constructor(
    public readonly apiService: ApiService,
    private readonly browserService: BrowserService
  ) {}

  public ngOnInit() {
    this.browserService.on(() =>
      this.apiService.getMusic().subscribe((data) => {
        setTimeout(() => {
          this.aplayer = new APlayer({
            container: document.getElementById('recent-music'),
            theme: 'var(--primary-100)',
            listMaxHeight: '320px',
            lrcType: 1,

            audio: data
          })
        }, 0)
      })
    )
  }

  public ngOnDestroy() {
    this.aplayer?.destroy()
  }
}

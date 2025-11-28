import { Component } from '@angular/core'
import { BangumiComponent } from '../../components/bangumi/bangumi.component'
import { LayoutService } from '../../services/layout.service'

@Component({
    selector: 'app-anime',
    imports: [BangumiComponent],
    template: `<app-bangumi [isAnime]="true" />`
})
export class AnimeComponent {
  public constructor(private readonly layoutService: LayoutService) {
    this.layoutService.setTitle('追番列表')
  }
}

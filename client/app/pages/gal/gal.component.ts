import { Component } from '@angular/core'
import { BangumiComponent } from '../../components/bangumi/bangumi.component'
import { LayoutService } from '../../services/layout.service'

@Component({
  selector: 'app-gal',
  standalone: true,
  imports: [BangumiComponent],
  template: `<app-bangumi [isAnime]="false"/>`
})
export class GalComponent {
  public constructor(private readonly layoutService: LayoutService) {
    this.layoutService.setTitle('Gal 列表')
  }
}

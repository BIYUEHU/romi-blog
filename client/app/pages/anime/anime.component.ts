import { Component } from '@angular/core'
import { BangumiComponent } from '../../components/bangumi/bangumi.component'

@Component({
  selector: 'app-anime',
  imports: [BangumiComponent],
  template: `<app-bangumi [isAnime]="true" />`
})
export class AnimeComponent {}

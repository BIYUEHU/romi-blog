import { Component } from '@angular/core'
import { BangumiComponent } from '../../components/bangumi/bangumi.component'

@Component({
  selector: 'app-gal',
  standalone: true,
  imports: [BangumiComponent],
  template: `<app-bangumi [isAnime]="false"/>`
})
export class GalComponent {}

import { Component } from '@angular/core'
import { BangumiComponent } from '../../components/bangumi/bangumi.component'
import { NotifyService } from '../../services/notify.service'

@Component({
  selector: 'app-gal',
  standalone: true,
  imports: [BangumiComponent],
  template: `<app-bangumi [isAnime]="false"/>`
})
export class GalComponent {
  public constructor(private readonly notifyService: NotifyService) {
    this.notifyService.setTitle('Gal 列表')
  }
}

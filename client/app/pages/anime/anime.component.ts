import { Component } from '@angular/core'
import { BangumiComponent } from '../../components/bangumi/bangumi.component'
import { NotifyService } from '../../services/notify.service'

@Component({
  selector: 'app-anime',
  standalone: true,
  imports: [BangumiComponent],
  template: `<app-bangumi [isAnime]="true" />`
})
export class AnimeComponent {
  public constructor(private readonly notifyService: NotifyService) {
    this.notifyService.setTitle('追番列表')
  }
}

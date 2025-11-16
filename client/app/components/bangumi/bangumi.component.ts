import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnInit } from '@angular/core'
import { LoadingComponent } from '../../components/loading/loading.component'
import { BangumiData } from '../../models/api.model'
import { ApiService } from '../../services/api.service'
import { NotifyService } from '../../services/notify.service'
import { CardComponent } from '../card/card.component'

@Component({
  selector: 'app-bangumi',
  standalone: true,
  imports: [LoadingComponent, CardComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './bangumi.component.html'
})
export class BangumiComponent implements OnInit {
  @Input({ required: true }) public isAnime!: boolean

  public isLoading = true
  public items: BangumiData['data'] = []

  private offset = 0
  private total = 0

  public data?: BangumiData

  public constructor(
    private readonly notifyService: NotifyService,
    private readonly apiService: ApiService
  ) {}

  public ngOnInit(): void {
    this.isLoading = true

    // TODO: 像其它第三方API，后端进行缓存，这样这里也可以改用为 SSR resolver
    this.apiService.getBangumi(0, this.isAnime).subscribe((data) => {
      this.data = data
      this.isLoading = false
      this.items = data.data
      this.total = data.total
      this.offset = Math.min(50, data.total)

      this.updateHeader()
    })
  }

  public loadMore(): void {
    if (this.offset >= this.total) {
      this.notifyService.showMessage('没有更多了', 'info')
      return
    }

    this.apiService.getBangumi(this.offset, this.isAnime).subscribe((data) => {
      this.items = [...this.items, ...data.data]
      this.offset = Math.min(this.offset + 50, this.total)
    })
  }

  private updateHeader(): void {
    const title = this.isAnime ? '追番列表' : 'Gal 列表'
    const typeName = this.isAnime ? '番剧' : 'Gal'

    this.notifyService.updateHeaderContent({
      title,
      subTitle: [`共 ${this.total} 部${typeName}`]
    })
  }
}

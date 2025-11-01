import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnInit } from '@angular/core'
import { LoadingComponent } from '../../components/loading/loading.component'
import { BangumiData } from '../../models/api.model'
import { NotifyService } from '../../services/notify.service'
import { romiComponentFactory } from '../../utils/romi-component-factory'
import { CardComponent } from '../card/card.component'

@Component({
  selector: 'app-bangumi',
  standalone: true,
  imports: [LoadingComponent, CardComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './bangumi.component.html'
})
export class BangumiComponent extends romiComponentFactory<BangumiData>('bangumi') implements OnInit {
  @Input({ required: true }) public isAnime!: boolean

  public isLoading = true
  public items: BangumiData['data'] = []

  private offset = 0
  private total = 0

  public constructor(private readonly notifyService: NotifyService) {
    super()
  }

  public ngOnInit(): void {
    this.isLoading = true

    this.loadData(this.apiService.getBangumi(0, this.isAnime)).subscribe((data) => {
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

import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnInit } from '@angular/core'
import { romiComponentFactory } from '../../utils/romi-component-factory'
import { NotifyService } from '../../services/notify.service'
import { BangumiData } from '../../models/api.model'
import { LoadingComponent } from '../../components/loading/loading.component'
import { CardComponent } from '../card/card.component'

@Component({
  selector: 'app-bangumi',
  standalone: true,
  imports: [LoadingComponent, CardComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './bangumi.component.html'
})
export class BangumiComponent extends romiComponentFactory<BangumiData>('bangumi') implements OnInit {
  public isLoading = true
  private offset = 0

  public items: BangumiData['data'] = []

  @Input({ required: true })
  public isAnime!: boolean

  public constructor(private readonly notifyService: NotifyService) {
    super()
  }

  public ngOnInit(): void {
    this.isLoading = true

    this.setData(
      (set) => this.loadData(true).then((data) => set(data)),
      (data) => {
        this.isLoading = false
        this.items = data.data
        this.offset = this.offset + 50 > data.total ? data.total : this.offset + 50
        if (this.isAnime) {
          this.notifyService.updateHeaderContent({
            title: '追番列表',
            subTitle: [`共 ${data.total} 部番剧`]
          })
        } else {
          this.notifyService.updateHeaderContent({
            title: 'Gal 列表',
            subTitle: [`共 ${data.total} 部 Gal`]
          })
        }
      }
    )
  }

  private loadData<T extends boolean, R = Promise<true extends T ? BangumiData : void>>(isFirst: T): R {
    return new Promise((resolve) => {
      if (!isFirst && this.offset === this.data?.total) {
        this.notifyService.showMessage('没有更多了', 'info')
        resolve(undefined)
        return
      }
      this.apiService.getBangumi(this.offset, this.isAnime).subscribe((data) => {
        if (isFirst) {
          resolve(data)
        } else {
          this.items = [...this.items, ...data.data]
          this.offset = this.offset + 50 > data.total ? data.total : this.offset + 50
          resolve(undefined)
        }
      })
    }) as R
  }

  public loadMore(): void {
    this.loadData(false).then()
  }
}

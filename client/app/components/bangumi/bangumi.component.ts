import { NgOptimizedImage } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnInit } from '@angular/core'
import { BangumiData } from '../../models/api.model'
import { ApiService } from '../../services/api.service'
import { NotifyService } from '../../services/notify.service'
import { AppTitleStrategy } from '../../shared/title-strategy'
import { CardComponent } from '../card/card.component'
import { SkeletonLoaderComponent } from '../skeleton-loader/skeleton-loader.component'

@Component({
  selector: 'app-bangumi',
  imports: [CardComponent, NgOptimizedImage, SkeletonLoaderComponent],
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
    private readonly appTitleStrategy: AppTitleStrategy,
    private readonly apiService: ApiService,
    private readonly notifyService: NotifyService
  ) {}

  public ngOnInit(): void {
    this.isLoading = true

    // TODO: 像其它第三方API，后端进行缓存，这样这里也可以改用为 SSR resolver，同时到也可以并入到 title strategy 把 header 逻辑
    this.apiService.getBangumi(0, this.isAnime).subscribe((data) => {
      this.data = data
      this.isLoading = false
      this.items = data.data
      this.total = data.total
      this.offset = Math.min(50, data.total)

      this.appTitleStrategy.updateHeader({
        title: this.isAnime ? '追番列表' : '视觉小说列表',
        subTitle: [`共 ${this.total} 部${this.isAnime ? '番剧' : '视觉小说'}`]
      })
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
}

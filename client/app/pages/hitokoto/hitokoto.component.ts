import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core'
import { LayoutComponent } from '../../components/layout/layout.component'
import { ResHitokotoData } from '../../models/api.model'
import { ApiService } from '../../services/api.service'
import { NotifyService } from '../../services/notify.service'
import { STORE_KEYS, StoreService } from '../../services/store.service'
import { AppTitleStrategy } from '../../shared/title-strategy'
import { HitokotosComponent } from '../hitokotos/hitokotos.component'

@Component({
  selector: 'app-hitokoto',
  imports: [LayoutComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './hitokoto.component.html'
})
export class HitokotoComponent {
  @Input() public hitokoto!: ResHitokotoData
  @Input() public readonly id?: string

  public isLoading = false

  public get isLiked() {
    return !!this.hitokoto && !!this.storeService.getItem(STORE_KEYS.hitokotoLiked(this.hitokoto.id))
  }

  public constructor(
    private readonly notifyService: NotifyService,
    private readonly appTitleStrategy: AppTitleStrategy,
    private readonly apiService: ApiService,
    private readonly storeService: StoreService
  ) {}

  public readonly getTagType = HitokotosComponent.prototype.getTagType

  public readonly getTypeName = HitokotosComponent.prototype.getTypeName

  public nextHitokoto() {
    this.isLoading = true
    this.apiService.getHitokoto().subscribe((data) => {
      this.hitokoto = data
      this.appTitleStrategy.setTitle(data.msg)
      this.isLoading = false
    })
  }

  public likeHitokoto() {
    if (this.isLiked) {
      this.notifyService.showMessage('已经点过赞了', 'info')
      return
    }

    this.apiService.likeHitokoto(this.hitokoto.id).subscribe(() => {
      this.storeService.setItem(STORE_KEYS.hitokotoLiked((this.hitokoto as ResHitokotoData).id), true)
      ;(this.hitokoto as ResHitokotoData).likes += 1
      this.notifyService.showMessage('点赞成功', 'success')
    })
  }

  public shareHitokoto() {
    if (!this.hitokoto) return
    navigator.clipboard.writeText(`${location.origin}/hitokoto/${this.hitokoto.id}`).then(
      () => this.notifyService.showMessage('链接已复制', 'secondary'),
      () => this.notifyService.showMessage('复制失败', 'error')
    )
  }
}

import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnInit } from '@angular/core'
import { LayoutUsingComponent } from '../../components/layout-using/layout-using.component'
import { ResHitokotoData } from '../../models/api.model'
import { ApiService } from '../../services/api.service'
import { BrowserService } from '../../services/browser.service'
import { NotifyService } from '../../services/notify.service'
import { KEYS } from '../../services/store.service'
import { HitokotosComponent } from '../hitokotos/hitokotos.component'

@Component({
  selector: 'app-hitokoto',
  standalone: true,
  imports: [LayoutUsingComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './hitokoto.component.html'
})
export class HitokotoComponent implements OnInit {
  @Input() public hitokoto!: ResHitokotoData
  @Input() public readonly id?: string

  public isLoading = false

  public showHelpDialog = false
  public get isLiked() {
    return !!this.hitokoto && !!this.browserService.store?.getItem(KEYS.HITOKOTO_LIKED(this.hitokoto.id))
  }

  public constructor(
    private readonly notifyService: NotifyService,
    private readonly browserService: BrowserService,
    private readonly apiService: ApiService
  ) {}

  public readonly getTagType = HitokotosComponent.prototype.getTagType

  public readonly getTypeName = HitokotosComponent.prototype.getTypeName

  public ngOnInit() {
    this.notifyService.setTitle(this.hitokoto.msg)
    this.notifyService.updateHeaderContent({
      title: '蛍の一言ひとこと',
      subTitle: []
    })
  }

  public nextHitokoto() {
    this.isLoading = true
    this.apiService.getHitokoto().subscribe((data) => {
      this.hitokoto = data
      this.notifyService.setTitle(data.msg)
      this.isLoading = false
    })
  }

  public likeHitokoto() {
    if (this.isLiked) {
      this.notifyService.showMessage('已经点过赞了', 'info')
      return
    }

    this.apiService.likeHitokoto(this.hitokoto.id).subscribe(() => {
      this.browserService.store!.setItem(KEYS.HITOKOTO_LIKED((this.hitokoto as ResHitokotoData).id), true)
      ;(this.hitokoto as ResHitokotoData).likes += 1
      this.notifyService.showMessage('点赞成功', 'success')
    })
  }

  public shareHitokoto() {
    if (!this.hitokoto) return
    const url = `${location.origin}/hitokoto/${this.hitokoto.id}`
    navigator.clipboard.writeText(url).then(
      () => this.notifyService.showMessage('链接已复制', 'secondary'),
      () => this.notifyService.showMessage('复制失败', 'error')
    )
  }
}

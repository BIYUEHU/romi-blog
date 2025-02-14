import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { ResHitokotoData } from '../../../output'
import { NotifyService } from '../../services/notify.service'
import { romiComponentFactory } from '../../utils/romi-component-factory'
import { LayoutUsingComponent } from '../../components/layout-using/layout-using.component'
import { HitokotosComponent } from '../hitokotos/hitokotos.component'

@Component({
  selector: 'app-hitokoto',
  standalone: true,
  imports: [LayoutUsingComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './hitokoto.component.html'
})
export class HitokotoComponent extends romiComponentFactory<ResHitokotoData>('hitokoto') implements OnInit {
  public showHelpDialog = false
  public isLiked = false

  public constructor(
    private readonly notifyService: NotifyService,
    private readonly route: ActivatedRoute
  ) {
    super()
  }

  public readonly getTagType = HitokotosComponent.prototype.getTagType

  public readonly getTypeName = HitokotosComponent.prototype.getTypeName

  public ngOnInit(): void {
    this.notifyService.updateHeaderContent({
      title: '蛍の一言ひとこと',
      subTitle: []
    })
    this.loadHitokoto(Number(this.route.snapshot.paramMap.get('id')))
  }

  private loadHitokoto(id?: number): void {
    this.setData((set) =>
      this.apiService.getHitokoto(id && !Number.isNaN(id) && id > 0 ? id : undefined).subscribe((data) => {
        set(data)
        this.isLiked = !!this.browserService.localStorage?.getItem(`hitokoto_like_${data.id}`)
      })
    )
  }

  public nextHitokoto(): void {
    this.loadHitokoto()
  }

  public likeHitokoto(): void {
    if (!this.data || this.isLiked) {
      this.notifyService.showMessage('已经点过赞了', 'info')
      return
    }

    this.apiService.likeHitokoto(this.data.id).subscribe(() => {
      this.browserService.localStorage?.setItem(`hitokoto_like_${(this.data as ResHitokotoData).id}`, 'true')
      ;(this.data as ResHitokotoData).likes += 1
      this.isLiked = true
      this.notifyService.showMessage('点赞成功', 'success')
    })
  }

  public shareHitokoto(): void {
    if (!this.data) return
    const url = `${location.origin}${location.pathname}/${this.data.id}`
    navigator.clipboard.writeText(url).then(
      () => this.notifyService.showMessage('链接已复制', 'secondary'),
      () => this.notifyService.showMessage('复制失败', 'error')
    )
  }
}

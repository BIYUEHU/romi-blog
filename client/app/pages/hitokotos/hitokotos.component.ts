import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core'
import { ResHitokotoData } from '../../models/api.model'
import { romiComponentFactory } from '../../utils/romi-component-factory'
import { NotifyService } from '../../services/notify.service'
import { RouterLink } from '@angular/router'

@Component({
  selector: 'app-hitokotos',
  standalone: true,
  imports: [RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './hitokotos.component.html'
})
export class HitokotosComponent extends romiComponentFactory<ResHitokotoData[]>('hitokotos') implements OnInit {
  public hitokotos: ResHitokotoData[] = []
  public isLoading = true

  public static readonly typeColors = ['#4CAF50', '#FF9800', '#03A9F4', '#F44336']
  public static readonly typeNames = ['二刺猿', '文艺', '俗语', '杂类']
  public static readonly tagTypes = ['success', 'warning', 'info', 'error']

  public constructor(private readonly notifyService: NotifyService) {
    super()
  }

  public ngOnInit(): void {
    this.isLoading = true

    this.notifyService.updateHeaderContent({
      title: '语录墙'
    })

    this.setData(
      (set) =>
        this.apiService.getHitokotos(true).subscribe((data) => {
          set(this.shuffleArray(data))
        }),
      (data) => {
        this.notifyService.updateHeaderContent({
          title: '语录墙',
          subTitle: [`共 ${data.length} 条语录`]
        })
        this.isLoading = false
        this.loadMore()
      }
    )
  }

  private shuffleArray<T>(array: T[]): T[] {
    return array.sort(() => Math.random() - 0.5)
  }

  public loadMore(): void {
    if (!this.data) return
    if (this.data.length === 0) {
      this.notifyService.showMessage('没有更多了', 'warning')
      return
    }
    this.hitokotos = [...this.hitokotos, ...this.data.slice(0, 20)]
    this.data = this.data.slice(20)
  }

  public likeHitokoto(id: number): void {
    if (this.isLiked(id)) return
    this.apiService.likeHitokoto(id).subscribe(() => {
      this.browserService.localStorage?.setItem(`hitokoto_like_${id}`, 'true')
      const hitokoto = this.hitokotos.find((h) => h.id === id)
      if (hitokoto) hitokoto.likes++
    })
  }

  public isLiked(id: number): boolean {
    return !!this.browserService.localStorage?.getItem(`hitokoto_like_${id}`)
  }

  public getTypeColor(type: number): string {
    return HitokotosComponent.typeColors[(type - 1) % HitokotosComponent.typeColors.length]
  }

  public getTypeName(type: number): string {
    return HitokotosComponent.typeNames[(type - 1) % HitokotosComponent.typeNames.length] || 'Unknown'
  }

  public getTagType(type: number): string {
    return HitokotosComponent.tagTypes[(type - 1) % HitokotosComponent.tagTypes.length]
  }
}

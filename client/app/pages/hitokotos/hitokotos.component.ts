import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnInit } from '@angular/core'
import { RouterLink } from '@angular/router'
import { ResHitokotoData } from '../../models/api.model'
import { ApiService } from '../../services/api.service'
import { LayoutService } from '../../services/layout.service'
import { STORE_KEYS, StoreService } from '../../services/store.service'

@Component({
  selector: 'app-hitokotos',
  imports: [RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './hitokotos.component.html'
})
export class HitokotosComponent implements OnInit {
  public static readonly typeColors = ['#4CAF50', '#FF9800', '#03A9F4', '#F44336']
  public static readonly typeNames = ['二刺猿', '文艺', '俗语', '杂类']
  public static readonly tagTypes = ['success', 'warning', 'info', 'error']

  @Input() public hitokotos: ResHitokotoData[] = []

  public constructor(
    private readonly layoutService: LayoutService,
    private readonly apiService: ApiService,
    private readonly storeService: StoreService
  ) {}

  public ngOnInit(): void {
    this.layoutService.setTitle('语录墙')
    this.hitokotos = this.shuffleArray(this.hitokotos)
    this.layoutService.updateHeader({
      title: '语录墙',
      subTitle: [`共 ${this.hitokotos.length} 条语录`]
    })
    this.loadMore()
  }

  private shuffleArray<T>(array: T[]): T[] {
    return array.sort(() => Math.random() - 0.5)
  }

  public loadMore(): void {
    if (!this.hitokotos) return
    if (this.hitokotos.length === 0) {
      this.layoutService.showMessage('没有更多了', 'warning')
      return
    }
    this.hitokotos = [...this.hitokotos, ...this.hitokotos.slice(0, 20)]
    this.hitokotos = this.hitokotos.slice(20)
  }

  public likeHitokoto(id: number): void {
    if (this.isLiked(id)) return
    this.apiService.likeHitokoto(id).subscribe(() => {
      this.storeService.setItem(STORE_KEYS.hitokotoLiked(id), true)
      const hitokoto = this.hitokotos.find((h) => h.id === id)
      if (hitokoto) hitokoto.likes += 1
    })
  }

  public isLiked(id: number): boolean {
    return !!this.storeService.getItem(STORE_KEYS.hitokotoLiked(id))
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

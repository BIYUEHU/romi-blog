import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnInit } from '@angular/core'
import { RouterLink } from '@angular/router'
import { ResHitokotoData } from '../../models/api.model'
import { ApiService } from '../../services/api.service'
import { NotifyService } from '../../services/notify.service'
import { STORE_KEYS, StoreService } from '../../services/store.service'
import { HITOKOTO_TYPES } from '../../shared/constants'
import { MessageBoxType } from '../../shared/types'
import { formatHitokotoSource } from '../../shared/utils'

@Component({
  selector: 'app-hitokotos',
  imports: [RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './hitokotos.component.html'
})
export class HitokotosComponent implements OnInit {
  public static readonly typeNames = HITOKOTO_TYPES.map(([, label]) => label)
  public static readonly tagTypes = [
    'secondary',
    'info',
    'success',
    'warning',
    'error',
    'primary',
    'secondary',
    'info',
    'warning'
  ]

  @Input() public hitokotos: ResHitokotoData[] = []
  public displayedHitokotos: ResHitokotoData[] = []

  public readonly formatHitokotoSource = formatHitokotoSource

  public constructor(
    private readonly notifyService: NotifyService,
    private readonly apiService: ApiService,
    private readonly storeService: StoreService
  ) {}

  public ngOnInit() {
    this.hitokotos = this.shuffleArray(this.hitokotos)
    this.loadMore()
  }

  private shuffleArray<T>(array: T[]): T[] {
    return array.sort(() => Math.random() - 0.5)
  }

  public loadMore() {
    if (this.hitokotos.length === 0) {
      this.notifyService.showMessage('没有更多了', MessageBoxType.Warning)
      return
    }
    this.displayedHitokotos = [...this.displayedHitokotos, ...this.hitokotos.slice(0, 20)]
    this.hitokotos = this.hitokotos.slice(20)
  }

  public likeHitokoto(uuid: string): void {
    if (this.isLiked(uuid)) return
    this.apiService.likeHitokoto(uuid).subscribe(() => {
      this.storeService.setItem(STORE_KEYS.hitokotoLiked(uuid), true)
      const hitokoto = this.hitokotos.find((h) => h.uuid === uuid)
      if (hitokoto) hitokoto.likes += 1
    })
  }

  public isLiked(uuid: string): boolean {
    return !!this.storeService.getItem(STORE_KEYS.hitokotoLiked(uuid))
  }

  public getTypeName(type: number): string {
    return HitokotosComponent.typeNames[(type - 1) % HitokotosComponent.typeNames.length] ?? '未知'
  }

  public getTagType(type: number): string {
    return HitokotosComponent.tagTypes[(type - 1) % HitokotosComponent.tagTypes.length] ?? 'secondary'
  }
}

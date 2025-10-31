import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { FormsModule } from '@angular/forms'
import {
  AbstractAdminBaseListComponent,
  AdminBaseListComponent
} from '../../components/admin-base-list/admin-base-list.component'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'
import { WebComponentSwitchAccessorDirective } from '../../directives/web-component-switch-accessor.directive'
import { ReqHitokotoData, ResHitokotoData } from '../../models/api.model'
import { ApiService } from '../../services/api.service'

@Component({
  selector: 'app-admin-hitokotos',
  standalone: true,
  imports: [
    FormsModule,
    WebComponentInputAccessorDirective,
    WebComponentSwitchAccessorDirective,
    AdminBaseListComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './admin-hitokotos.component.html'
})
export class AdminHitokotosComponent extends AbstractAdminBaseListComponent<ResHitokotoData> {
  public filterType = 0
  public editingHitokoto: ResHitokotoData | null = null

  public newHitokoto: ReqHitokotoData = {
    msg: '',
    from: '',
    type: 1,
    is_public: false
  }

  public readonly types = [
    { value: 1, label: '二刺猿' },
    { value: 2, label: '文艺' },
    { value: 3, label: '俗语' },
    { value: 4, label: '杂类' }
  ]

  public constructor(private readonly apiService: ApiService) {
    super()
    this.loadItems()
    this.notifyService.setTitle('一言管理')
  }

  protected loadItems(): void {
    this.isLoading = true
    this.apiService.getHitokotos(false).subscribe((data) => {
      this.items = data.reverse()
      this.isLoading = false
    })
  }

  protected searchPredicate(hitokoto: ResHitokotoData, query: string): boolean {
    const filterType = Number(this.filterType)
    const matchesSearch = hitokoto.msg.toLowerCase().includes(query) || hitokoto.from.toLowerCase().includes(query)
    return filterType ? hitokoto.type === filterType && matchesSearch : matchesSearch
  }

  protected deleteItem(id: number): void {
    if (this.confirmDelete()) {
      this.apiService.deleteHitokoto(id).subscribe(() => {
        this.notifyService.showMessage('一言删除成功', 'secondary')
        this.items = this.items.filter((h) => h.id !== id)
      })
    }
  }

  public createHitokoto() {
    if (!this.newHitokoto.msg.trim()) {
      this.notifyService.showMessage('请输入一言内容', 'warning')
      return
    }

    this.apiService.createHitokoto({ ...this.newHitokoto, type: Number(this.newHitokoto.type) }).subscribe(() => {
      this.loadItems()
      this.cancelEdit()
      this.notifyService.showMessage('一言创建成功', 'success')
    })
  }

  public startEdit(hitokoto: ResHitokotoData) {
    this.editingHitokoto = hitokoto
    this.newHitokoto = {
      msg: hitokoto.msg,
      from: hitokoto.from,
      type: hitokoto.type,
      is_public: hitokoto.is_public
    }
  }

  public cancelEdit() {
    this.editingHitokoto = null
    this.newHitokoto = { msg: '', from: '', type: 1, is_public: false }
  }

  public updateHitokoto() {
    if (!this.editingHitokoto) return

    this.apiService
      .updateHitokoto(this.editingHitokoto.id, { ...this.newHitokoto, type: Number(this.newHitokoto.type) })
      .subscribe(() => {
        this.loadItems()
        this.cancelEdit()
        this.notifyService.showMessage('一言更新成功', 'success')
      })
  }
}

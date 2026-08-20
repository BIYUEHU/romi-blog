import { DatePipe } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import {
  AbstractAdminBaseListComponent,
  AdminBaseListComponent
} from '../../components/admin-base-list/admin-base-list.component'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'
import { WebComponentSwitchAccessorDirective } from '../../directives/web-component-switch-accessor.directive'
import { ReqHitokotoData, ResHitokotoData } from '../../models/api.model'
import { ApiService } from '../../services/api.service'
import { HITOKOTO_TYPES } from '../../shared/constants'
import { MessageBoxType } from '../../shared/types'

@Component({
  selector: 'app-admin-hitokotos',
  imports: [
    FormsModule,
    WebComponentInputAccessorDirective,
    WebComponentSwitchAccessorDirective,
    AdminBaseListComponent,
    DatePipe
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './admin-hitokotos.component.html'
})
export class AdminHitokotosComponent extends AbstractAdminBaseListComponent<ResHitokotoData> implements OnInit {
  protected readonly Number = Number
  public filterType = 0
  public editingHitokoto: ResHitokotoData | null = null

  public newHitokoto: ReqHitokotoData = {
    msg: '',
    msgOrigin: null,
    from: null,
    fromWho: null,
    type: 1,
    likes: 0,
    public: false
  }

  public readonly types = HITOKOTO_TYPES

  public constructor(private readonly apiService: ApiService) {
    super()
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
    const matchesSearch =
      hitokoto.msg.toLowerCase().includes(query) ||
      !!hitokoto.msgOrigin?.toLowerCase().includes(query) ||
      !!hitokoto.from?.toLowerCase().includes(query) ||
      !!hitokoto.fromWho?.toLowerCase().includes(query)
    return filterType ? hitokoto.type === filterType && matchesSearch : matchesSearch
  }

  protected deleteItem(uuid: string) {
    if (!this.confirmDelete()) return
    this.apiService.deleteHitokoto(uuid).subscribe(() => {
      this.notifyService.showMessage('一言删除成功', MessageBoxType.Secondary)
      this.items = this.items.filter((h) => h.uuid !== uuid)
    })
  }

  public ngOnInit() {
    this.loadItems()
  }

  public createHitokoto() {
    if (!this.newHitokoto.msg.trim()) {
      this.notifyService.showMessage('请输入一言内容', MessageBoxType.Warning)
      return
    }
    this.apiService
      .createHitokoto({
        ...this.newHitokoto,
        msg: this.newHitokoto.msg.trim(),
        type: Number(this.newHitokoto.type),
        likes: Number(this.newHitokoto.likes)
      })
      .subscribe(() => {
        this.loadItems()
        this.cancelEdit()
        this.notifyService.showMessage('一言创建成功', MessageBoxType.Success)
      })
  }

  public startEdit(hitokoto: ResHitokotoData) {
    this.editingHitokoto = hitokoto
    this.newHitokoto = {
      msg: hitokoto.msg,
      msgOrigin: hitokoto.msgOrigin,
      from: hitokoto.from,
      fromWho: hitokoto.fromWho,
      type: hitokoto.type,
      likes: hitokoto.likes,
      public: hitokoto.public
    }
  }

  public cancelEdit() {
    this.editingHitokoto = null
    this.newHitokoto = { msg: '', msgOrigin: null, from: null, fromWho: null, type: 1, likes: 0, public: false }
  }

  public updateHitokoto() {
    if (!this.editingHitokoto) return
    this.apiService
      .updateHitokoto(this.editingHitokoto.uuid, {
        ...this.newHitokoto,
        type: Number(this.newHitokoto.type),
        likes: Number(this.newHitokoto.likes)
      })
      .subscribe(() => {
        this.loadItems()
        this.cancelEdit()
        this.notifyService.showMessage('一言更新成功', MessageBoxType.Success)
      })
  }
}

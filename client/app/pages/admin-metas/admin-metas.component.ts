import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'
import { ResMetaData } from '../../models/api.model'
import { ApiService } from '../../services/api.service'
import { LayoutService } from '../../services/layout.service'

@Component({
    selector: 'app-admin-meta',
    imports: [FormsModule, WebComponentInputAccessorDirective],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './admin-metas.component.html'
})
export class AdminMetasComponent implements OnInit {
  public metas: ResMetaData[] = []
  public isLoading = true
  public searchQuery = ''
  public newMetaName = ''
  public isAddingCategory = false

  public constructor(
    private readonly apiService: ApiService,
    private readonly layoutService: LayoutService
  ) {
    this.layoutService.setTitle('字段管理')
  }

  public ngOnInit() {
    this.loadMetas()
  }

  private loadMetas() {
    this.isLoading = true
    this.apiService.getMetas().subscribe((data) => {
      this.metas = data
      this.isLoading = false
    })
  }

  public get categories() {
    return this.metas.filter(
      (meta) => meta.is_category && meta.name.toLowerCase().includes(this.searchQuery.toLowerCase())
    )
  }

  public get tags() {
    return this.metas.filter(
      (meta) => !meta.is_category && meta.name.toLowerCase().includes(this.searchQuery.toLowerCase())
    )
  }

  public createMeta() {
    if (!this.newMetaName.trim()) {
      this.layoutService.showMessage('请输入名称', 'warning')
      return
    }

    const data = {
      name: this.newMetaName.trim(),
      is_category: this.isAddingCategory
    }

    this.apiService.createMeta(data).subscribe(() => {
      this.layoutService.showMessage('创建成功', 'success')
      this.loadMetas()
      this.newMetaName = ''
    })
  }

  public deleteMeta(id: number, name: string) {
    if (confirm(`确定要删除"${name}"吗？`)) {
      this.apiService.deleteMeta(id).subscribe(() => {
        this.layoutService.showMessage('删除成功', 'secondary')
        this.metas = this.metas.filter((meta) => meta.mid !== id)
      })
    }
  }
}

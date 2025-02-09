import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { ApiService } from '../../services/api.service'
import { ResMetaData } from '../../../output'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'

@Component({
  selector: 'app-admin-meta',
  standalone: true,
  imports: [CommonModule, FormsModule, WebComponentInputAccessorDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './admin-metas.component.html'
})
export class AdminMetasComponent implements OnInit {
  public metas: ResMetaData[] = []
  public isLoading = true
  public searchQuery = ''
  public newMetaName = ''
  public isAddingCategory = false

  public constructor(private apiService: ApiService) {}

  public ngOnInit() {
    this.loadMetas()
  }

  private loadMetas() {
    this.isLoading = true
    this.apiService.getMetas().subscribe({
      next: (data) => {
        this.metas = data
        this.isLoading = false
      },
      error: (error) => {
        console.error('Failed to load metas:', error)
        this.isLoading = false
      }
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
    if (!this.newMetaName.trim()) return

    const data = {
      name: this.newMetaName.trim(),
      is_category: this.isAddingCategory
    }

    this.apiService.createMeta(data).subscribe({
      next: () => {
        this.loadMetas()
        this.newMetaName = ''
      },
      error: (error) => {
        console.error('Failed to create meta:', error)
      }
    })
  }

  public deleteMeta(id: number, name: string) {
    if (confirm(`确定要删除"${name}"吗？`)) {
      this.apiService.deleteMeta(id).subscribe({
        next: () => {
          this.metas = this.metas.filter((meta) => meta.mid !== id)
        },
        error: (error) => {
          console.error('Failed to delete meta:', error)
        }
      })
    }
  }
}

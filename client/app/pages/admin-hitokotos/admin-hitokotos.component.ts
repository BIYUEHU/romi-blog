import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { ApiService } from '../../services/api.service'
import { ResHitokotoData, ReqHitokotoData } from '../../../output'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'

enum HitokotoType {
  Anime = 1,
  Literature = 2,
  Proverb = 3,
  Miscellaneous = 4
}

@Component({
  selector: 'app-admin-hitokotos',
  standalone: true,
  imports: [CommonModule, FormsModule, WebComponentInputAccessorDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './admin-hitokotos.component.html'
})
export class AdminHitokotosComponent implements OnInit {
  public hitokotos: ResHitokotoData[] = []
  public isLoading = true
  public searchQuery = ''
  public filterType = 0
  public editingHitokoto: ResHitokotoData | null = null
  public currentPage = 1
  public pageSize = 10
  public get pages() {
    const totalPages = Math.ceil(this.filteredHitokotos.length / this.pageSize)
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  public newHitokoto: ReqHitokotoData = {
    msg: '',
    from: '',
    type: 1
  }

  public readonly types = [
    { value: 1, label: '二刺猿' },
    { value: 2, label: '文艺' },
    { value: 3, label: '俗语' },
    { value: 4, label: '杂类' }
  ]

  public constructor(private apiService: ApiService) {}

  public ngOnInit() {
    this.loadHitokotos()
  }

  private loadHitokotos() {
    this.isLoading = true
    this.apiService.getHitokotos(false).subscribe({
      next: (data) => {
        this.hitokotos = data.reverse()
        this.isLoading = false
      },
      error: (error) => {
        console.error('Failed to load hitokotos:', error)
        this.isLoading = false
      }
    })
  }

  public get filteredHitokotos() {
    const filterType = Number(this.filterType)
    return this.hitokotos.filter((hitokoto) => {
      const matchesSearch =
        hitokoto.msg.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        hitokoto.from.toLowerCase().includes(this.searchQuery.toLowerCase())
      return filterType ? hitokoto.type === filterType && matchesSearch : matchesSearch
    })
  }

  public get pagedHitokotos() {
    const filtered = this.filteredHitokotos
    const start = (this.currentPage - 1) * this.pageSize
    return filtered.slice(start, start + this.pageSize)
  }

  public goToPage(page: number) {
    this.currentPage = page
  }

  public createHitokoto() {
    if (!this.newHitokoto.msg.trim()) {
      // TODO: show error message
      return
    }

    this.apiService.createHitokoto(this.newHitokoto).subscribe({
      next: () => {
        this.loadHitokotos()
        this.newHitokoto = { msg: '', from: '', type: 1 }
      },
      error: (error) => {
        console.error('Failed to create hitokoto:', error)
      }
    })
  }

  public startEdit(hitokoto: ResHitokotoData) {
    this.editingHitokoto = hitokoto
    this.newHitokoto = {
      msg: hitokoto.msg,
      from: hitokoto.from,
      type: hitokoto.type
    }
  }

  public cancelEdit() {
    this.editingHitokoto = null
    this.newHitokoto = { msg: '', from: '', type: 1 }
  }

  public updateHitokoto() {
    if (!this.editingHitokoto) return

    this.apiService.updateHitokoto(this.editingHitokoto.id, this.newHitokoto).subscribe({
      next: () => {
        this.loadHitokotos()
        this.cancelEdit()
      },
      error: (error) => {
        console.error('Failed to update hitokoto:', error)
      }
    })
  }

  public deleteHitokoto(id: number) {
    if (confirm('确定要删除这条一言吗？')) {
      this.apiService.deleteHitokoto(id).subscribe({
        next: () => {
          this.hitokotos = this.hitokotos.filter((h) => h.id !== id)
        },
        error: (error) => {
          console.error('Failed to delete hitokoto:', error)
        }
      })
    }
  }
}

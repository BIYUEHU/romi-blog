import { Component, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, Input, inject, Output } from '@angular/core'
import { NotifyService } from '../../services/notify.service'

@Component({
  selector: 'app-admin-base-list',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './admin-base-list.component.html'
})
export class AdminBaseListComponent {
  @Input() items: unknown[] = []
  @Input() isLoading = true
  @Input() currentPage = 1
  @Input() pages: number[] = []
  @Output() pageChange = new EventEmitter<number>()
}

export abstract class AbstractAdminBaseListComponent<T> {
  protected readonly notifyService = inject(NotifyService)

  public items: T[] = []
  public isLoading = true
  public searchQuery = ''
  public emptyMessage = '暂无数据'
  public currentPage = 1
  public pageSize = 10

  protected abstract loadItems(): void

  protected abstract searchPredicate(item: T, query: string): boolean

  protected abstract deleteItem(id: number | string): void

  public get pages() {
    return Array.from({ length: Math.ceil(this.filteredItems.length / this.pageSize) }, (_, i) => i + 1)
  }

  public get filteredItems() {
    return this.items.filter((item) => this.searchPredicate(item, this.searchQuery.toLowerCase()))
  }

  public get pagedItems() {
    const start = (this.currentPage - 1) * this.pageSize
    return this.filteredItems.slice(start, start + this.pageSize)
  }

  public goToPage(page: number) {
    this.currentPage = page
  }

  protected confirmDelete(): boolean {
    return confirm('确定要删除这条数据吗？')
  }
}

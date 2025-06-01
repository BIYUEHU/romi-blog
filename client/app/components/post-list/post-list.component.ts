import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, OnInit } from '@angular/core'
import { RouterLink } from '@angular/router'
import { LoadingComponent } from '../../components/loading/loading.component'
import { ResPostData } from '../../models/api.model'
import { DatePipe } from '@angular/common'
import { CardComponent } from '../card/card.component'

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [DatePipe, LoadingComponent, RouterLink, CardComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './post-list.component.html'
})
export class PostListComponent implements OnInit {
  @Input() posts?: ResPostData[]
  @Input() pageSize = 6

  public currentPage = 1
  public totalPages = 1
  public displayedPosts: ResPostData[] = []

  public ngOnInit() {
    this.updateDisplayedPosts()
  }

  public ngOnChanges() {
    if (this.posts) {
      this.posts = this.posts.filter(({ hide }) => !hide)
      this.totalPages = Math.ceil(this.posts.length / this.pageSize)
      this.currentPage = 1
      this.updateDisplayedPosts()
    }
  }

  private updateDisplayedPosts() {
    if (!this.posts) return

    const startIndex = (this.currentPage - 1) * this.pageSize
    const endIndex = startIndex + this.pageSize
    this.displayedPosts = this.posts.slice(startIndex, endIndex)
  }

  public goToPage(page: number | string) {
    if (typeof page !== 'number') return
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page
      this.updateDisplayedPosts()
    }
  }

  public getPageNumbers(): (number | string)[] {
    if (this.totalPages <= 1) return []
    const pages: (number | string)[] = []

    for (let i = 2; i < this.totalPages; i++) {
      if (i === this.currentPage - 1) {
        if (i !== 2) pages.push('...')
        pages.push(i)
      } else if (i === this.currentPage) {
        pages.push(i)
      } else if (i === this.currentPage + 1) {
        pages.push(i)
        if (i !== this.totalPages - 1) pages.push('...')
      }
    }

    return [
      this.currentPage > 1 ? 'prev' : null,
      1,
      ...pages,
      this.totalPages > 1 ? this.totalPages : null,
      this.currentPage < this.totalPages ? 'next' : null
    ].filter((page) => page !== null) as (number | string)[]
  }
}

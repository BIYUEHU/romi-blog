import { DatePipe, NgOptimizedImage } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnInit } from '@angular/core'
import { RouterLink } from '@angular/router'
import { ResPostData } from '../../models/api.model'
import { CardComponent } from '../card/card.component'

@Component({
    selector: 'app-post-list',
    imports: [DatePipe, RouterLink, CardComponent, NgOptimizedImage],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './post-list.component.html'
})
export class PostListComponent implements OnInit {
  @Input({ required: true }) posts!: ResPostData[]
  @Input() pageSize = 6

  public currentPage = 1
  public totalPages = 1
  public displayedPosts: ResPostData[] = []

  public ngOnInit() {
    this.updateDisplayedPosts()
    this.posts = this.posts.filter(({ hide }) => !hide)
    this.totalPages = Math.ceil(this.posts.length / this.pageSize)
    this.currentPage = 1
    this.updateDisplayedPosts()
  }

  private updateDisplayedPosts() {
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

    for (let i = 2; i < this.totalPages; i += 1) {
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

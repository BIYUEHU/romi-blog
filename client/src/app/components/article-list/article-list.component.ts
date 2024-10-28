import { Component, type OnInit } from '@angular/core'
import type { Article } from '../../models/article.model'
import { ArticleService } from '../../services/article.service'
import { TuiDialogService } from '@taiga-ui/core'

@Component({
  selector: 'app-article-list',
  templateUrl: './article-list.component.html'
  // styleUrls: ['./article-list.component.scss'],
})
export class ArticleListComponent implements OnInit {
  articles: Article[] = []
  loading = false
  columns = ['title', 'created', 'views', 'likes', 'comments', 'actions']

  constructor(
    private articleService: ArticleService,
    private dialogService: TuiDialogService
  ) {}

  ngOnInit(): void {
    this.loadArticles()
  }

  loadArticles(): void {
    this.loading = true
    this.articleService.getArticles().subscribe({
      next: (data) => {
        this.articles = data
        this.loading = false
      },
      error: (error) => {
        console.error('Error loading articles:', error)
        this.loading = false
      }
    })
  }
}

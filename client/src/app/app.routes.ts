import type { Routes } from '@angular/router'
import { ArticleListComponent } from './components/article-list/article-list.component'

export const routes: Routes = [
  { path: 'articles', component: ArticleListComponent },
  // { path: 'articles/new', component: ArticleEditComponent },
  // { path: 'articles/edit/:id', component: ArticleEditComponent },
  { path: '', redirectTo: 'articles', pathMatch: 'full' }
]

import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { map, switchMap, type Observable } from 'rxjs'
import type { Post, Author, ExternalHitokoto } from '../models/blog.model'
import { API_BASE_URL } from '../shared/constants'
import { parseMarkdown } from '../../utils/parseMarkdown'

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private apiUrl = API_BASE_URL

  constructor(private http: HttpClient) {}

  getArticlesTesting() {
    return this.http
      .get<string[]>(`${this.apiUrl}/articles/test`)
      .pipe(map((data) => data.map((text) => parseMarkdown(text))))
  }

  getPosts() {
    return this.http.get<Post[]>(`${this.apiUrl}/articles`)
  }

  getPost(id: string) {
    return this.http.get<Post>(`${this.apiUrl}/articles/${id}`)
  }

  getAuthor() {
    return this.http.get<Author>(`${this.apiUrl}/author`)
  }

  getHitokoto() {
    return this.http.get<ExternalHitokoto>('https://hotaru.icu/api/hitokoto/v2/')
  }
}

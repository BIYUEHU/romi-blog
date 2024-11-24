import { Injectable } from '@angular/core'
// biome-ignore lint:
import { HttpClient } from '@angular/common/http'
import { map, type Observable } from 'rxjs'
import type { Post, Author } from '../models/blog.model'
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

  getPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}/articles`)
  }

  getPost(id: string): Observable<Post> {
    return this.http.get<Post>(`${this.apiUrl}/articles/${id}`)
  }

  getAuthor(): Observable<Author> {
    return this.http.get<Author>(`${this.apiUrl}/author`)
  }
}

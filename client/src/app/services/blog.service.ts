import { Injectable } from '@angular/core'
// biome-ignore lint:
import { HttpClient } from '@angular/common/http'
import type { Observable } from 'rxjs'
import type { Post, Author } from '../models/blog.model'
import { API_BASE_URL } from '../shared/constants'

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private apiUrl = API_BASE_URL

  constructor(private http: HttpClient) {}

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

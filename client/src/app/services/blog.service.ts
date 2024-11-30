import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { map } from 'rxjs'
import type { ExternalHitokoto, ResPostData, ResPostSingleData } from '../models/blog.model'
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
      .get<string[]>(`${this.apiUrl}/posts/test`)
      .pipe(map((data) => data.map((text) => parseMarkdown(text))))
  }

  getPosts() {
    return this.http.get<ResPostData[]>(`${this.apiUrl}/posts`)
  }

  getPost(id: string) {
    return this.http.get<ResPostSingleData>(`${this.apiUrl}/posts/${id}`)
  }

  getHitokoto() {
    return this.http.get<ExternalHitokoto>('https://hotaru.icu/api/hitokoto/v2/')
  }
}

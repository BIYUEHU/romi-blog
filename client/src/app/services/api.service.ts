import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { map } from 'rxjs'
import type { ExternalHitokoto, ResPostData, ResPostSingleData } from '../models/api.model'
import { API_BASE_URL } from '../shared/constants'
import { parseMarkdown } from '../../utils/parseMarkdown'

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = API_BASE_URL

  public constructor(private readonly http: HttpClient) {}

  public getArticlesTesting() {
    return this.http
      .get<string[]>(`${this.apiUrl}/posts/test`)
      .pipe(map((data) => data.map((text) => parseMarkdown(text))))
  }

  public getPosts() {
    return this.http.get<ResPostData[]>(`${this.apiUrl}/posts`)
  }

  public getPost(id: string) {
    return this.http.get<ResPostSingleData>(`${this.apiUrl}/posts/${id}`)
  }

  public getHitokoto() {
    return this.http.get<ExternalHitokoto>('https://api.hotaru.icu/ial/hitokoto/v2/')
  }
}

import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { map, of } from 'rxjs'
import type { ExternalHitokoto, ResPostData, ResPostSingleData } from '../models/api.model'
import { API_BASE_URL } from '../shared/constants'

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = API_BASE_URL

  public constructor(private readonly http: HttpClient) {}

  public getPosts() {
    return this.http.get<ResPostData[]>(`${this.apiUrl}/post`)
  }

  public getPost(id: string) {
    return this.http.get<ResPostSingleData>(`${this.apiUrl}/post/${id}`)
  }

  public getHitokoto() {
    // return this.http.get<ExternalHitokoto>('https://api.hotaru.icu/ial/hitokoto/v2/')
    return of<ExternalHitokoto>({
      data: {
        id: 1,
        msg: '一切皆有可能，只要我们努力。',
        from: '白居易'
      }
    })
  }
}

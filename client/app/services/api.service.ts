import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { ResMetaData, type ResHitokotoData, type ResPostData, type ResPostSingleData } from '../models/api.model'
import { API_BASE_URL } from '../shared/constants'

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly apiUrl = API_BASE_URL

  public constructor(private readonly http: HttpClient) {}

  public getPosts() {
    return this.http.get<ResPostData[]>(`${this.apiUrl}/post`)
  }

  public getPost(id: string) {
    return this.http.get<ResPostSingleData>(`${this.apiUrl}/post/${id}`)
  }

  public getHitokoto() {
    return this.http.get<ResHitokotoData>(`${this.apiUrl}/hitokoto`)
  }

  public getMetas() {
    return this.http.get<ResMetaData[]>(`${this.apiUrl}/meta`)
  }
}

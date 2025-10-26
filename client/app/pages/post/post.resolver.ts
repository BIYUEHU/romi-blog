import { inject } from '@angular/core'
import { ResolveFn } from '@angular/router'
import { ResPostSingleData } from '../../models/api.model'
import { ApiService } from '../../services/api.service'

export const postResolver: ResolveFn<ResPostSingleData> = (route) => {
  const apiService = inject(ApiService)
  const id = +route.paramMap.get('id')!

  return apiService.getPost(id)
}

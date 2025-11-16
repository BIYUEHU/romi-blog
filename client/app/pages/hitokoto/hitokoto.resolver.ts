import { inject } from '@angular/core'
import { ResolveFn } from '@angular/router'
import { ResHitokotoData } from '../../models/api.model'
import { ApiService } from '../../services/api.service'

export const hitokotoResolver: ResolveFn<ResHitokotoData> = (route) => {
  const id = route.paramMap.get('id')
  return id ? inject(ApiService).getHitokoto(+id) : inject(ApiService).getHitokoto()
}

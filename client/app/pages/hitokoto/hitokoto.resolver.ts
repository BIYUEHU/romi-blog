import { inject } from '@angular/core'
import { ResolveFn } from '@angular/router'
import { ResHitokotoData } from '../../models/api.model'
import { ApiService } from '../../services/api.service'

export const hitokotoResolver: ResolveFn<ResHitokotoData> = (route) => {
  const uuid = route.paramMap.get('uuid')
  return uuid ? inject(ApiService).getHitokoto(uuid) : inject(ApiService).getHitokoto()
}

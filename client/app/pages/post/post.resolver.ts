import { inject } from '@angular/core'
import { ResolveFn } from '@angular/router'
import { ResPostSingleData } from '../../models/api.model'
import { ApiService } from '../../services/api.service'

export const postResolver: ResolveFn<ResPostSingleData> = (route) =>
  inject(ApiService).getPost(+route.paramMap.get('id')!)

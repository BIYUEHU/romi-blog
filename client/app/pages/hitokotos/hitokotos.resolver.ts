import { inject } from '@angular/core'
import { ResolveFn } from '@angular/router'
import { ResHitokotoData } from '../../models/api.model'
import { ApiService } from '../../services/api.service'

export const hitokotosResolver: ResolveFn<ResHitokotoData[]> = () => inject(ApiService).getHitokotos(true)

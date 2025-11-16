import { inject } from '@angular/core'
import { ResolveFn } from '@angular/router'
import { ResNewsData } from '../../models/api.model'
import { ApiService } from '../../services/api.service'

export const newsesResolver: ResolveFn<ResNewsData[]> = () => inject(ApiService).getNewses()

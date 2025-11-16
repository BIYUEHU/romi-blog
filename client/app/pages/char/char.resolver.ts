import { inject } from '@angular/core'
import { ResolveFn } from '@angular/router'
import { ResCharacterData } from '../../models/api.model'
import { ApiService } from '../../services/api.service'

export const charResolver: ResolveFn<ResCharacterData> = (route) =>
  inject(ApiService).getCharacter(+route.paramMap.get('id')!)

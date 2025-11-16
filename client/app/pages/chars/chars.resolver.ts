import { inject } from '@angular/core'
import { ResolveFn } from '@angular/router'
import { ResCharacterData } from '../../models/api.model'
import { ApiService } from '../../services/api.service'

export const charsResolver: ResolveFn<ResCharacterData[]> = () => inject(ApiService).getCharacters()

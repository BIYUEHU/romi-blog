import { inject } from '@angular/core'
import { ResolveFn } from '@angular/router'
import { ResSettingsData } from '../../output'
import { ApiService } from '../services/api.service'

export const settingsResolver: ResolveFn<ResSettingsData> = () => inject(ApiService).getSettings()

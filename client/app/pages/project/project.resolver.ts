import { inject } from '@angular/core'
import { ResolveFn } from '@angular/router'
import { ResProjectData } from '../../models/api.model'
import { ApiService } from '../../services/api.service'

export const projectResolver: ResolveFn<ResProjectData[]> = () => inject(ApiService).getProjects()

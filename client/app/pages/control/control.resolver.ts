import { inject } from '@angular/core'
import { ResolveFn, Router } from '@angular/router'
import { EMPTY } from 'rxjs'
import { ResPostSingleData } from '../../../output'
import { ApiService } from '../../services/api.service'
import { ControlComponent } from './control.component'

export const controlResolver: ResolveFn<ResPostSingleData> = (route) => {
  const apiService = inject(ApiService)
  const router = inject(Router)
  const id = ControlComponent.DEPENDENT_PAGES.find(({ name }) => name === route.url[0]?.path)?.id

  if (!id) {
    router.navigate(['/404']).then()
    return EMPTY
  }

  return apiService.getPost(id)
}

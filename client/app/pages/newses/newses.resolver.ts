import { inject } from '@angular/core'
import { ResolveFn } from '@angular/router'
import { map } from 'rxjs/operators'
import { ResNewsData } from '../../models/api.model'
import { ApiService } from '../../services/api.service'
import { sortByCreatedTime } from '../../shared/utils'

export const newsesResolver: ResolveFn<ResNewsData[]> = () =>
  inject(ApiService)
    .getNewses()
    .pipe(map((list) => sortByCreatedTime(list)))

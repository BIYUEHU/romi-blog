import { inject } from '@angular/core'
import { ResolveFn } from '@angular/router'
import { map } from 'rxjs/operators'
import { ResPostData } from '../../models/api.model'
import { ApiService } from '../../services/api.service'
import { sortByCreatedTime } from '../../shared/utils'

export const postsResolver: ResolveFn<ResPostData[]> = () =>
  inject(ApiService)
    .getPosts()
    .pipe(map((list) => sortByCreatedTime(list)))

import { inject } from '@angular/core'
import { ResolveFn, Router } from '@angular/router'
import { map, tap } from 'rxjs/operators'
import { ResPostData } from '../../models/api.model'
import { ApiService } from '../../services/api.service'
import { sortByCreatedTime } from '../../shared/utils'

export const tagResolver: ResolveFn<ResPostData[]> = (route) => {
  const tag = route.paramMap.get('tag') ?? ''
  const router = inject(Router)
  return inject(ApiService)
    .getPosts()
    .pipe(
      map((list) => sortByCreatedTime(list).filter((post) => post.tags.includes(tag))),
      tap((posts) => {
        if (posts.length === 0) router.navigate(['/404'])
      })
    )
}

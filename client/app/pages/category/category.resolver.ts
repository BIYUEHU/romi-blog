import { inject } from '@angular/core'
import { ResolveFn, Router } from '@angular/router'
import { map, tap } from 'rxjs/operators'
import { ResPostData } from '../../models/api.model'
import { ApiService } from '../../services/api.service'
import { sortByCreatedTime } from '../../shared/utils'

export const categoryResolver: ResolveFn<ResPostData[]> = (route) => {
  const category = route.paramMap.get('category') ?? ''
  const router = inject(Router)
  return inject(ApiService)
    .getPosts()
    .pipe(
      map((list) => sortByCreatedTime(list).filter((post) => post.categories.includes(category))),
      tap((posts) => {
        if (posts.length === 0) router.navigate(['/404'])
      })
    )
}

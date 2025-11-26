import { inject } from '@angular/core'
import { ResolveFn, Router } from '@angular/router'
import { EMPTY, forkJoin, of } from 'rxjs'
import { ResPostSingleData } from '../../../output'
import { ApiService } from '../../services/api.service'
import { DependentPage } from '../../shared/types'

const DEPENDENT_PAGES: DependentPage[] = [
  {
    name: 'about',
    title: '关于',
    id: 25,
    routine: true,
    hideToc: true,
    hideComments: false
  },
  {
    name: 'log',
    title: '日志',
    id: 26,
    routine: true,
    hideToc: false,
    hideComments: true
  },
  {
    name: 'links',
    title: '友情链接',
    id: 6,
    routine: false,
    template: 'links'
  }
]

export const dynamicResolver: ResolveFn<[DependentPage, ResPostSingleData]> = (route) => {
  const apiService = inject(ApiService)
  const router = inject(Router)
  const slug = route.paramMap.get('slug')
  const data = DEPENDENT_PAGES.find(({ name }) => name === slug)

  if (!data) {
    router.navigate(['/404'])
    return EMPTY
  }

  return forkJoin([of(data), apiService.getPost(data.id)])
}

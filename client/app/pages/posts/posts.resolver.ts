import { inject } from '@angular/core'
import { ResolveFn } from '@angular/router'
import { ResPostData } from '../../models/api.model'
import { ApiService } from '../../services/api.service'

export const postsResolver: ResolveFn<ResPostData[]> = () => inject(ApiService).getPosts()

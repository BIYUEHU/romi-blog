import { inject } from '@angular/core'
import { ResolveFn } from '@angular/router'
import { forkJoin, map } from 'rxjs'
import { ResMusicData, ResNewsData, ResPostData, ResProjectData, Video } from '../../models/api.model'
import { ApiService } from '../../services/api.service'

type HomeData = {
  posts: ResPostData[]
  news: ResNewsData[]
  videos: Video[]
  projects: ResProjectData[]
  music: ResMusicData[]
}

export const homeResolver: ResolveFn<HomeData> = () => {
  const apiService = inject(ApiService)

  return forkJoin({
    posts: apiService.getPosts().pipe(
      map((data) =>
        data
          .filter(({ hide }) => !hide)
          .sort((a, b) => b.created - a.created)
          .slice(0, 4)
      )
    ),
    news: apiService.getNewses().pipe(map((data) => data.sort((a, b) => b.created - a.created).slice(0, 4))),
    videos: apiService.getVideos().pipe(map((data) => data.sort((a, b) => b.created - a.created).slice(0, 4))),
    projects: apiService.getProjects().pipe(map((data) => data.slice(0, 4))),
    music: apiService.getMusic()
  })
}

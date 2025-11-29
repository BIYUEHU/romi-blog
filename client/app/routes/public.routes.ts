import { Routes } from '@angular/router'
import { LayoutWrapperComponent } from '../components/layout-wrapper/layout-wrapper.component'
import { AnimeComponent } from '../pages/anime/anime.component'
import { ArchiveComponent } from '../pages/archive/archive.component'
import { CategoryComponent } from '../pages/category/category.component'
import { CharComponent } from '../pages/char/char.component'
import { charResolver } from '../pages/char/char.resolver'
import { CharsComponent } from '../pages/chars/chars.component'
import { charsResolver } from '../pages/chars/chars.resolver'
import { ForbiddenComponent } from '../pages/forbidden/forbidden.component'
import { GalComponent } from '../pages/gal/gal.component'
import { HitokotoComponent } from '../pages/hitokoto/hitokoto.component'
import { hitokotoResolver } from '../pages/hitokoto/hitokoto.resolver'
import { HitokotosComponent } from '../pages/hitokotos/hitokotos.component'
import { hitokotosResolver } from '../pages/hitokotos/hitokotos.resolver'
import { HomeComponent } from '../pages/home/home.component'
import { homeResolver } from '../pages/home/home.resolver'
import { MusicComponent } from '../pages/music/music.component'
import { NewsComponent } from '../pages/news/news.component'
import { newsResolver } from '../pages/news/news.resolver'
import { NewsesComponent } from '../pages/newses/newses.component'
import { newsesResolver } from '../pages/newses/newses.resolver'
import { NotFoundComponent } from '../pages/not-found/not-found.component'
import { PostComponent } from '../pages/post/post.component'
import { PostsComponent } from '../pages/posts/posts.component'
import { postsResolver } from '../pages/posts/posts.resolver'
import { ProjectComponent } from '../pages/project/project.component'
import { projectResolver } from '../pages/project/project.resolver'
import { ServerErrorComponent } from '../pages/server-error/server-error.component'
import { TagComponent } from '../pages/tag/tag.component'

export const publicRoutes: Routes = [
  {
    path: '',
    component: HomeComponent,
    resolve: {
      home: homeResolver
    },
    pathMatch: 'full'
  },
  {
    path: '',
    component: LayoutWrapperComponent,
    children: [
      {
        path: 'post/:id',
        component: PostComponent
      },
      {
        path: 'post',
        component: PostsComponent,
        resolve: {
          posts: postsResolver
        }
      },
      {
        path: 'archive',
        component: ArchiveComponent,
        resolve: {
          posts: postsResolver
        }
      },
      {
        path: 'tag/:name',
        component: TagComponent,
        resolve: {
          posts: postsResolver
        }
      },
      {
        path: 'category/:name',
        component: CategoryComponent,
        resolve: {
          posts: postsResolver
        }
      },
      {
        path: 'hitokotos',
        component: HitokotosComponent,
        resolve: {
          hitokotos: hitokotosResolver
        }
      },
      {
        path: 'anime',
        component: AnimeComponent
      },
      {
        path: 'gal',
        component: GalComponent
      },
      {
        path: 'news',
        component: NewsesComponent,
        resolve: {
          newses: newsesResolver
        }
      },
      {
        path: 'news/:id',
        component: NewsComponent,
        resolve: {
          news: newsResolver
        }
      },
      {
        path: 'music',
        component: MusicComponent
      },
      {
        path: 'char',
        component: CharsComponent,
        resolve: {
          chars: charsResolver
        }
      },
      {
        path: 'char/:id',
        component: CharComponent,
        resolve: {
          char: charResolver
        }
      },
      {
        path: 'project',
        component: ProjectComponent,
        resolve: {
          projects: projectResolver
        }
      },
      {
        path: '403',
        component: ForbiddenComponent
      },
      {
        path: '404',
        component: NotFoundComponent
      },
      {
        path: '500',
        component: ServerErrorComponent
      }
    ]
  },
  {
    path: 'hitokoto',
    component: HitokotoComponent,
    resolve: {
      hitokotos: hitokotosResolver
    }
  },
  {
    path: 'hitokoto/:id',
    component: HitokotoComponent,
    resolve: {
      hitokoto: hitokotoResolver
    }
  }
]

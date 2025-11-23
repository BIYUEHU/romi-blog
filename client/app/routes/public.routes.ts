import { LayoutWrapperComponent } from '../components/layout-wrapper/layout-wrapper.component'
import { AnimeComponent } from '../pages/anime/anime.component'
import { ArchiveComponent } from '../pages/archive/archive.component'
import { CategoryComponent } from '../pages/category/category.component'
import { CharComponent } from '../pages/char/char.component'
import { charResolver } from '../pages/char/char.resolver'
import { CharsComponent } from '../pages/chars/chars.component'
import { charsResolver } from '../pages/chars/chars.resolver'
import { ControlComponent } from '../pages/control/control.component'
import { controlResolver } from '../pages/control/control.resolver'
import { GalComponent } from '../pages/gal/gal.component'
import { HitokotoComponent } from '../pages/hitokoto/hitokoto.component'
import { HitokotosComponent } from '../pages/hitokotos/hitokotos.component'
import { hitokotosResolver } from '../pages/hitokotos/hitokotos.resolver'
import { HomeComponent } from '../pages/home/home.component'
import { homeResolver } from '../pages/home/home.resolver'
import { MusicComponent } from '../pages/music/music.component'
import { NewsComponent } from '../pages/news/news.component'
import { newsResolver } from '../pages/news/news.resolver'
import { NewsesComponent } from '../pages/newses/newses.component'
import { newsesResolver } from '../pages/newses/newses.resolver'
import { PostComponent } from '../pages/post/post.component'
import { postResolver } from '../pages/post/post.resolver'
import { PostsComponent } from '../pages/posts/posts.component'
import { postsResolver } from '../pages/posts/posts.resolver'
import { ProjectComponent } from '../pages/project/project.component'
import { projectResolver } from '../pages/project/project.resolver'
import { TagComponent } from '../pages/tag/tag.component'
import { defineRoutes } from '../shared/tools'

export const publicRoutes = defineRoutes([
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
        component: PostComponent,
        resolve: {
          post: postResolver
        }
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
      hitokotos: hitokotosResolver
    }
  },
  {
    path: '**',
    component: ControlComponent,
    resolve: {
      post: controlResolver
    },
    pathMatch: 'full'
  }
])

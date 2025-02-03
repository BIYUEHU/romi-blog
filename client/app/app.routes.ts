import type { Routes } from '@angular/router'
import { HomeComponent } from './pages/home/home.component'
import { PostComponent } from './pages/post/post.component'
import { ArchiveComponent } from './pages/archive/archive.component'
// import { AboutComponent } from './pages/about/about.component'
// import { FriendsComponent } from './pages/friends/friends.component'

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
    // title: 'Romi Blog - Home'
  },
  {
    path: 'post/:id',
    component: PostComponent
    // title: 'Article'
  },
  // {
  //   path: 'about',
  //   component: AboutComponent,
  //   title: 'About'
  // },
  {
    path: 'archive',
    component: ArchiveComponent,
    title: 'Archives'
  },
  // {
  //   path: 'friends',
  //   component: FriendsComponent,
  //   title: 'Friends'
  // },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
]

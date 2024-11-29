import type { Routes } from '@angular/router'
import { HomeComponent } from './pages/home/home.component'
import { PostComponent } from './pages/post/post.component'
// import { AboutComponent } from './pages/about/about.component'
// import { ArchivesComponent } from './pages/archives/archives.component'
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
  // {
  //   path: 'archives',
  //   component: ArchivesComponent,
  //   title: 'Archives'
  // },
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

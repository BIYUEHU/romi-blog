import { Component, type OnInit } from '@angular/core'
import { ResPostData } from '../../models/api.model'
import { PostListComponent } from '../../components/post-list/post-list.component'
import { romiComponentFactory } from '../../utils/romi-component-factory'

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [PostListComponent],
  template: `<app-post-list  [posts]="data" />`
})
export class HomeComponent extends romiComponentFactory<ResPostData[]>('home') implements OnInit {
  public ngOnInit(): void {
    this.setData((set) => this.apiService.getPosts().subscribe((data) => set(data)))
  }
}

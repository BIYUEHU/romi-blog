import { Component, type OnInit } from '@angular/core'
import { BlogService } from '../../services/blog.service'
import { ResPostData } from '../../models/blog.model'
import { CommonModule, DatePipe } from '@angular/common'
import { LoadingComponent } from '../../loading/loading.component'
import { RouterLink } from '@angular/router'

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, LoadingComponent, RouterLink],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  public posts?: ResPostData[]

  public constructor(private readonly blogService: BlogService) {}

  public ngOnInit() {
    this.blogService.getPosts().subscribe((posts) => {
      this.posts = posts
    })
  }
}

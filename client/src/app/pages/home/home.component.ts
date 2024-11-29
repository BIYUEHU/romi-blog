import { Component, type OnInit } from '@angular/core'
import { BlogService } from '../../services/blog.service'
import { Post } from '../../models/blog.model'
import { CommonModule, DatePipe } from '@angular/common'
import { RouterLink } from '@angular/router'

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, DatePipe, CommonModule],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  public posts: Post[] = []

  public constructor(private blogService: BlogService) {}

  public ngOnInit() {
    this.blogService.getArticlesTesting().subscribe((posts) => {
      this.posts = posts as Post[]
      console.log(this.posts)
    })
  }
}

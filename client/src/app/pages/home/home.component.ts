import { Component, OnInit } from '@angular/core'
import { BlogService } from '../../services/blog.service'
import { Post } from '../../models/blog.model'
import { DatePipe } from '@angular/common'
import { RouterLink } from '@angular/router'

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  posts: Post[] = []

  constructor(private blogService: BlogService) {}

  ngOnInit() {
    this.blogService.getArticlesTesting().subscribe((posts) => {
      this.posts = posts as Post[]
      console.log(this.posts)
    })
  }
}

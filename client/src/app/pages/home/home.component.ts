import { Component, OnInit } from '@angular/core'
import { BlogService } from '../../services/blog.service'
import { Post } from '../../models/blog.model'
import { DatePipe } from '@angular/common'
import { RouterLink } from '@angular/router'

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="container mx-auto px-4 pt-20">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        @for (post of posts; track post.id) {
          <article class="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
            @if (post.cover) {
              <img [src]="post.cover"
                   class="w-full h-48 object-cover"
                   [alt]="post.title">
            }
            <div class="p-6">
              <h2 class="text-xl font-bold text-white mb-2">
                <a [routerLink]="['/post', post.id]">{{post.title}}</a>
              </h2>
              <p class="text-gray-400">{{post.summary}}</p>
              <div class="mt-4 text-sm text-gray-500">
                {{post.date | date:'yyyy-MM-dd'}}
              </div>
            </div>
          </article>
        }
      </div>
    </div>
  `
})
export class HomeComponent implements OnInit {
  posts: Post[] = []

  constructor(private blogService: BlogService) {}

  ngOnInit() {
    this.blogService.getPosts().subscribe((posts) => {
      this.posts = posts
    })
  }
}

import { Component, type OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { BlogService } from '../../services/blog.service'
import type { Post } from '../../models/blog.model'
import { marked } from 'marked'
import { DatePipe } from '@angular/common'

@Component({
  selector: 'app-post',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="container mx-auto px-4 pt-20">
      <article class="prose prose-invert lg:prose-xl mx-auto">
        <h1 class="text-3xl font-bold text-white mb-4">{{post?.title}}</h1>
        <div class="text-gray-400 mb-8">{{post?.date | date:'yyyy-MM-dd'}}</div>
        <div class="markdown-body" [innerHTML]="renderedContent"></div>
      </article>
    </div>
  `
})
export class PostComponent implements OnInit {
  post: Post | null = null
  renderedContent = ''

  constructor(
    private route: ActivatedRoute,
    private blogService: BlogService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')
    if (id) {
      this.blogService.getPost(id).subscribe(async (post) => {
        this.post = post
        this.renderedContent = await marked(post.content)
      })
    }
  }
}

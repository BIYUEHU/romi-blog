import { Component, type OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { BlogService } from '../../services/blog.service'
import type { ResPostSingleData } from '../../models/blog.model'
import { marked } from 'marked'
import { DatePipe } from '@angular/common'
import { LoadingComponent } from '../../loading/loading.component'

@Component({
  selector: 'app-post',
  standalone: true,
  imports: [DatePipe, LoadingComponent],
  templateUrl: './post.component.html'
})
export class PostComponent implements OnInit {
  public post: ResPostSingleData | null = null
  public renderedContent = ''

  constructor(
    private route: ActivatedRoute,
    private blogService: BlogService
  ) {}

  public ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')
    if (id) {
      this.blogService.getPost(id).subscribe(async (post) => {
        this.post = post
        this.renderedContent = await marked(post.text)
      })
    }
  }
}

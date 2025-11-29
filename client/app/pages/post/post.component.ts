import { Component, Input, OnInit } from '@angular/core'
import { ResPostSingleData } from '../../../output'
import { PostContentComponent } from '../../components/post-content/post-content.component'
import { SkeletonLoaderComponent } from '../../components/skeleton-loader/skeleton-loader.component'
import { ApiService } from '../../services/api.service'

@Component({
  selector: 'app-post',
  imports: [PostContentComponent, SkeletonLoaderComponent],
  templateUrl: './post.component.html'
})
export class PostComponent implements OnInit {
  @Input() public readonly id!: string
  public post?: ResPostSingleData

  public constructor(private readonly apiService: ApiService) {}

  public ngOnInit() {
    this.apiService.getPost(+this.id).subscribe((post) => {
      this.post = post
    })
  }
}

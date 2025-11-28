import { Component, Input } from '@angular/core'
import { ResPostSingleData } from '../../../output'
import { PostContentComponent } from '../../components/post-content/post-content.component'

@Component({
    selector: 'app-post',
    imports: [PostContentComponent],
    templateUrl: './post.component.html'
})
export class PostComponent {
  @Input() public readonly post!: ResPostSingleData
}

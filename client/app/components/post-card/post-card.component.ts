import { DatePipe, NgOptimizedImage } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core'
import { RouterLink } from '@angular/router'
import { ResPostData } from '../../../output'
import { CardComponent } from '../card/card.component'

@Component({
  selector: 'app-post-card',
  imports: [NgOptimizedImage, RouterLink, DatePipe, CardComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './post-card.component.html'
})
export class PostCardComponent {
  @Input() public post!: ResPostData
}

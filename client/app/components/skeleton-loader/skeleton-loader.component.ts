import { Component, Input } from '@angular/core'

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  templateUrl: './skeleton-loader.component.html'
})
export class SkeletonLoaderComponent {
  @Input() type: string = 'text'
}

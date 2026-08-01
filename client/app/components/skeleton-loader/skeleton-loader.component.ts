import { Component, Input } from '@angular/core'

@Component({
  selector: 'app-skeleton-loader',
  templateUrl: './skeleton-loader.component.html'
})
export class SkeletonLoaderComponent {
  @Input() public type: string = 'text'
}

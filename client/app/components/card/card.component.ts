import { Component, Input } from '@angular/core'

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [],
  templateUrl: './card.component.html'
})
export class CardComponent {
  @Input() public class = ''
}

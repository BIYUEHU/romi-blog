import { Component, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { PostContentComponent } from '../../components/post-content/post-content.component'

@Component({
  selector: 'app-post',
  standalone: true,
  imports: [PostContentComponent],
  templateUrl: './post.component.html'
})
export class PostComponent implements OnInit {
  public id?: number

  public constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  public ngOnInit() {
    this.id = Number(this.route.snapshot.paramMap.get('id'))
    if (Number.isNaN(this.id) || this.id <= 0) this.router.navigate(['/404'])
  }
}

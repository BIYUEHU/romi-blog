import { Component, type OnInit } from '@angular/core'
import { ApiService } from '../../services/api.service'
import { ResPostData } from '../../models/api.model'
import { CommonModule, DatePipe } from '@angular/common'
import { LoadingComponent } from '../../loading/loading.component'
import { RouterLink } from '@angular/router'

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, LoadingComponent, RouterLink],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  public posts?: ResPostData[]

  public constructor(private readonly apiService: ApiService) {}

  public ngOnInit() {
    this.apiService.getPosts().subscribe((posts) => {
      this.posts = posts
    })
  }
}

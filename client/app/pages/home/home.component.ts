import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit } from '@angular/core'
import { CommonModule, DatePipe } from '@angular/common'
import { RouterLink } from '@angular/router'
import { LoadingComponent } from '../../components/loading/loading.component'
import { ResPostData } from '../../models/api.model'
import { ResNewsData } from '../../models/api.model'
import { Video } from '../../models/api.model'
import { APlayer } from '../../shared/types'
import { ApiService } from '../../services/api.service'
import musicList from '../../shared/music.json'

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, LoadingComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  public isLoading = true
  public posts: ResPostData[] = []
  public news: ResNewsData[] = []
  public videos: Video[] = []
  private aplayer?: APlayer

  public constructor(private readonly apiService: ApiService) {}

  private initAplayer() {
    this.aplayer = new APlayer({
      container: document.getElementById('recent-music'),
      mini: false,
      autoplay: false,
      theme: '#d87cb6',
      loop: 'all',
      order: 'list',
      preload: 'auto',
      volume: 0.7,
      mutex: true,
      listFolded: true,
      listMaxHeight: '200px',
      audio: musicList
    })
  }

  public ngOnInit() {
    this.apiService.getPosts().subscribe((posts) => {
      this.posts = posts.slice(0, 4)
    })

    this.apiService.getNewses().subscribe((news) => {
      this.news = news.slice(0, 3)
    })

    this.apiService.getVideos().subscribe((videos) => {
      this.videos = videos.slice(0, 4)
      this.isLoading = false
    })
    setTimeout(() => this.initAplayer(), 0)
  }
}

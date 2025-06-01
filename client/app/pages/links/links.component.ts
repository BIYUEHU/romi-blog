import { Component, Input } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { PostContentComponent } from '../../components/post-content/post-content.component'
import { CardComponent } from '../../components/card/card.component'

interface ResFriendData {
  name: string
  link: string
  avatar: string
  description: string
}

@Component({
  selector: 'app-links',
  standalone: true,
  imports: [FormsModule, PostContentComponent, CardComponent],
  templateUrl: './links.component.html'
})
export class LinksComponent {
  @Input({ required: true }) public id!: number

  public links: ResFriendData[] = [
    {
      name: 'BIYUEHU',
      link: 'https://biyuehu.github.io',
      avatar: '/favicon.ico',
      description: 'Web Developer & Open Source Enthusiast'
    },
    {
      name: 'Romichan',
      link: 'https://romichan.com',
      avatar: '/favicon.ico',
      description: 'Romichan 是一个基于 Angular 开发的开源论坛软件'
    },
    {
      name: 'V2EX',
      link: 'https://v2ex.com',
      avatar: '/favicon.ico',
      description: 'V2EX 是一个基于 Node.js 开发的社区软件'
    },
    {
      name: 'Romichan',
      link: 'https://romichan.com',
      avatar: '/favicon.ico',
      description: 'Romichan 是一个基于 Angular 开发的开源论坛软件'
    },
    {
      name: 'V2EX',
      link: 'https://v2ex.com',
      avatar: '/favicon.ico',
      description: 'V2EX 是一个基于 Node.js 开发的社区软件'
    }
  ]
}

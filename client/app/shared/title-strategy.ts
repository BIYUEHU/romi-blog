import { Injectable, signal } from '@angular/core'
import { Title } from '@angular/platform-browser'
import { ResolveFn, RouterStateSnapshot, TitleStrategy } from '@angular/router'
import { pipe } from 'fp-ts/function'
import { iso, Newtype } from 'newtype-ts'
import { match } from 'ts-pattern'
import { ResCharacterData, ResHitokotoData, ResNewsData, ResPostData } from '../models/api.model'
import { dynamicResolver } from '../pages/dynamic/dynamic.resolver'
import { BrowserService } from '../services/browser.service'
import { DEFAULT_TITLE } from './constants'

export interface UrlPattern
  extends Newtype<
    { readonly UrlPattern: unique symbol },
    | { readonly _tag: 'Starts'; value: string }
    | { readonly _tag: 'Full'; value: string }
    | { readonly _tag: 'Ends'; value: string }
    | { readonly _tag: 'All' }
  > {}

const isoUrlPattern = iso<UrlPattern>()

export const Starts = (value: string) => isoUrlPattern.wrap({ _tag: 'Starts', value })
export const Full = (value: string) => isoUrlPattern.wrap({ _tag: 'Full', value })
export const Ends = (value: string) => isoUrlPattern.wrap({ _tag: 'Ends', value })
export const All = isoUrlPattern.wrap({ _tag: 'All' })

export function testUrlPattern(url: string, pattern: UrlPattern): boolean {
  return match(isoUrlPattern.unwrap(pattern))
    .with({ _tag: 'Starts' }, ({ value }) => url.startsWith(value))
    .with({ _tag: 'Full' }, ({ value }) => url === value)
    .with({ _tag: 'Ends' }, ({ value }) => url.endsWith(value))
    .with({ _tag: 'All' }, () => true)
    .exhaustive()
}

export function dispatchUrlPattern(target: string, list: [UrlPattern, () => void][]) {
  for (const [pattern, callback] of list) if (testUrlPattern(target, pattern)) return callback()
}

@Injectable({
  providedIn: 'root'
})
export class AppTitleStrategy extends TitleStrategy {
  public static readonly DEFAULT_HEADER = {
    title: 'Arimura Sena',
    subTitle: ['What is mind? No matter.', 'What is matter? Never mind.'],
    imageUrl: 'api/utils/background'
  }

  public constructor(
    private readonly title: Title,
    // private readonly meta: Meta,
    private readonly browserService: BrowserService
  ) {
    super()
  }

  private readonly header = signal(AppTitleStrategy.DEFAULT_HEADER)

  public readonly header$ = this.header.asReadonly()

  public updateHeader(data: Partial<typeof AppTitleStrategy.DEFAULT_HEADER>) {
    this.header.update((header) => ({ ...header, ...data }))
  }

  private getResolvedRoute(snapshot: RouterStateSnapshot) {
    let route = snapshot.root
    while (route.firstChild) route = route.firstChild
    return route
  }

  public setTitle(title?: string) {
    this.title.setTitle(title?.trim() ? `${title.slice(0, 30)} - ${DEFAULT_TITLE}` : DEFAULT_TITLE)
  }

  public override updateTitle(snapshot: RouterStateSnapshot) {
    pipe(this.buildTitle(snapshot), (title) => {
      const route = this.getResolvedRoute(snapshot)
      dispatchUrlPattern(snapshot.url, [
        [Full('/'), () => this.homePage()],
        [Full('/posts'), () => this.postsPage(title ?? '', route.data['posts'])],
        [Full('/newses'), () => this.newsesPage(title ?? '', route.data['newses'])],
        [Full('/chars'), () => this.charsPage(title ?? '', route.data['chars'])],
        [Full('/project'), () => this.projectPage(title ?? '')],
        [Starts('/news/'), () => this.newsPage(route.data['news'])],
        [Full('/404'), () => this.notFoundPage()],
        [Starts('/tag/'), () => this.tagPage(route.paramMap.get('tag') ?? '', route.data['posts'])],
        [Starts('/category/'), () => this.categoryPage(route.paramMap.get('category') ?? '', route.data['posts'])],
        [Starts('/char/'), () => this.charPage(route.data['char'])],
        // [Starts('/post/'), () => this.postPage(route.data['post'])],
        [Starts('/hitokoto/'), () => this.hitokotoPage(route.data['hitokoto'])],
        [
          All,
          () => {
            const dynamic = route.data['dynamic']
            if (dynamic) {
              this.dynamicPage(dynamic)
            } else {
              this.setTitle(title)
              this.updateHeader({ title, subTitle: [] })
            }
          }
        ]
      ])
    })
  }

  private homePage() {
    this.setTitle()
    this.updateHeader({ title: '', subTitle: [] })
  }

  private postsPage(title: string, posts: ResPostData[]) {
    this.updateHeader({ title, subTitle: [`共 ${posts.length} 篇文章`] })
  }

  private newsesPage(title: string, newses: ResNewsData[]) {
    this.updateHeader({ title, subTitle: [`共 ${newses.length} 条动态`] })
  }

  private charsPage(title: string, chars: ResCharacterData[]) {
    this.updateHeader({
      title,
      subTitle: [`总计 ${chars.length} 位角色`, '这里收集了曾经历的故事中邂逅并令之心动的美少女角色~']
    })
  }

  private projectPage(title: string) {
    this.updateHeader({ title, subTitle: ['这里是我的一些开源作品，大部分都是练手或者实用的小工具'] })
  }

  private tagPage(tag: string, posts: ResPostData[]) {
    this.setTitle(`${tag} 标签`)
    this.updateHeader({ title: `#${tag}`, subTitle: [`共 ${posts.length} 篇文章`] })
  }

  private categoryPage(category: string, posts: ResPostData[]) {
    this.setTitle(`${category} 分类`)
    this.updateHeader({ title: `#${category}`, subTitle: [`共 ${posts.length} 篇文章`] })
  }

  private newsPage(news: ResNewsData) {
    this.setTitle(news.text)
    this.updateHeader({
      title: '动态详情',
      subTitle: [`${news.views} 次阅读 • ${news.comments} 条评论 • ${news.likes} 人喜欢`]
    })
  }

  private charPage(char: ResCharacterData) {
    this.setTitle(`${char.name} ${char.romaji}`)
    this.updateHeader({ title: char.name, subTitle: [char.romaji, char.description] })
  }

  private hitokotoPage(hitokoto: ResHitokotoData) {
    this.setTitle(hitokoto.msg)
    this.updateHeader({ title: '蛍の一言ひとこと', subTitle: [] })
  }

  private notFoundPage() {
    this.browserService.on(() => this.setTitle(`${innerWidth >= 768 ? '电脑' : '手机'}哥给我干哪去了啊？？`))
  }

  private dynamicPage(dynamic: typeof dynamicResolver extends ResolveFn<infer T> ? T : never) {
    this.setTitle(dynamic[0].title)
    this.updateHeader({ title: dynamic[0].title })
  }
}

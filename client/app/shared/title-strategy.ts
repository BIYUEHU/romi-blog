import { Injectable } from '@angular/core'
import { Title } from '@angular/platform-browser'
import { ResolveFn, RouterStateSnapshot, TitleStrategy } from '@angular/router'
import { iso, Newtype } from 'newtype-ts'
import { match } from 'ts-pattern'
import { ResCharacterData, ResHitokotoData, ResNewsData, ResPostData } from '../../output'
import { dynamicResolver } from '../pages/dynamic/dynamic.resolver'
import { BrowserService } from '../services/browser.service'
import { LayoutService } from '../services/layout.service'
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
  public constructor(
    private readonly title: Title,
    // private readonly meta: Meta,
    private readonly browserService: BrowserService,
    private readonly layoutService: LayoutService
  ) {
    super()
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
    const title = this.buildTitle(snapshot)
    const route = this.getResolvedRoute(snapshot)
    dispatchUrlPattern(snapshot.url, [
      [Full('/'), () => this.homePage()],
      [Full('/posts'), () => this.postsPage(title ?? '', route.data['posts'])],
      [Full('/newses'), () => this.newsesPage(title ?? '', route.data['newses'])],
      [Full('/chars'), () => this.charsPage(title ?? '', route.data['chars'])],
      [Full('/project'), () => this.projectPage(title ?? '')],
      [Full('/news/'), () => this.newsPage(route.data['news'])],
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
            this.layoutService.updateHeader({ title, subTitle: [] })
          }
        }
      ]
    ])
  }

  private homePage() {
    this.setTitle()
    this.layoutService.updateHeader({ title: '', subTitle: [] })
  }

  private postsPage(title: string, posts: ResPostData[]) {
    this.layoutService.updateHeader({ title, subTitle: [`共 ${posts.length} 篇文章`] })
  }

  private newsesPage(title: string, newses: ResNewsData[]) {
    this.layoutService.updateHeader({ title, subTitle: [`共 ${newses.length} 条动态`] })
  }

  private charsPage(title: string, chars: ResCharacterData[]) {
    this.layoutService.updateHeader({
      title,
      subTitle: [`总计 ${chars.length} 位角色`, '这里收集了曾经历的故事中邂逅并令之心动的美少女角色~']
    })
  }

  private projectPage(title: string) {
    this.layoutService.updateHeader({ title, subTitle: ['这里是我的一些开源作品，大部分都是练手或者实用的小工具'] })
  }

  // private postPage(post: ResPostSingleData) {
  // TODO: 更多的页面细化处理 meta 更好的 seo
  // this.meta.updateTag({ name: 'description', content: post.summary })
  // this.meta.updateTag({ property: 'og:title', content: post.title })
  // this.meta.updateTag({ property: 'og:image', content: post.coverImage })
  // this.setTitle(post.title)
  // this.layoutService.updateHeader({
  //   title: post.title,
  //   subTitle: [
  //     `创建时间：${formatDate(new Date(post.created * 1000))} | 更新时间：${formatDate(
  //       new Date(post.modified * 1000)
  //     )}`,
  //     `${post.views} 次阅读 ${post.allow_comment ? `•  ${post.comments} 条评论 ` : ''}•  ${post.likes} 人喜欢`
  //   ],
  //   ...(post.banner ? { imageUrl: post.banner } : {})
  // })
  // }

  private tagPage(tag: string, posts: ResPostData[]) {
    this.setTitle(`${tag} 标签`)
    this.layoutService.updateHeader({ title: `#${tag}`, subTitle: [`共 ${posts.length} 篇文章`] })
  }

  private categoryPage(category: string, posts: ResPostData[]) {
    this.setTitle(`${category} 分类`)
    this.layoutService.updateHeader({ title: `#${category}`, subTitle: [`共 ${posts.length} 篇文章`] })
  }

  private newsPage(news: ResNewsData) {
    this.setTitle(news.text)
    this.layoutService.updateHeader({
      title: '动态详情',
      subTitle: [`${news.views} 次阅读 • ${news.comments} 条评论 • ${news.likes} 人喜欢`]
    })
  }

  private charPage(char: ResCharacterData) {
    this.setTitle(`${char.name} ${char.romaji}`)
    this.layoutService.updateHeader({ title: char.name, subTitle: [char.romaji, char.description] })
  }

  private hitokotoPage(hitokoto: ResHitokotoData) {
    this.setTitle(hitokoto.msg)
    this.layoutService.updateHeader({ title: '蛍の一言ひとこと', subTitle: [] })
  }

  private notFoundPage() {
    this.browserService.on(() => this.setTitle(`${innerWidth >= 768 ? '电脑' : '手机'}哥给我干哪去了啊？？`))
  }

  private dynamicPage(dynamic: typeof dynamicResolver extends ResolveFn<infer T> ? T : never) {
    this.setTitle(dynamic[0].title)
    this.layoutService.updateHeader({ title: dynamic[0].title })
  }
}

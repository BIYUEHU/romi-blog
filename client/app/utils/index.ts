import { ResPostData } from '../models/api.model'

export function handlePostList(posts: ResPostData[]) {
  return posts.map((post) => (post.password === 'password' ? { ...post, summary: '文章已加密' } : post))
}

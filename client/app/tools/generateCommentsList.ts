export interface CommentData {
  id: number
  created: number
  text: string
  author: {
    username: string
    avatar: string
  }
  likes: number
  reply: number
}

function generateRandomComment(id: number, isReply = false): CommentData {
  // 常见中文姓氏
  const surnames = ['李', '王', '张', '刘', '陈', '杨', '黄', '赵', '吴', '周']

  // 常见网名后缀
  const nicknameSuffixes = [
    '浩',
    '峰',
    '超',
    '强',
    '伟',
    '军',
    '洋',
    '雪',
    '琳',
    '媛',
    '小帅',
    '大神',
    '爱编程',
    'coding',
    'dev',
    '学习中',
    '007',
    'pro',
    '666',
    '233'
  ]

  // 评论内容模板
  const commentTemplates = [
    '这篇文章写得很好，特别是关于{topic}的部分很有启发。',
    '学习了，关于{topic}的讲解很清晰。',
    '打卡学习，支持博主继续输出高质量内容！',
    '不错的文章，但是我觉得{topic}这部分还可以展开讲讲。',
    '收藏了，回头仔细看，先点个赞👍',
    '文章对我帮助很大，终于理解{topic}了。',
    '博主写得很用心，但是{topic}这里我有点疑问。',
    '期待博主更多关于{topic}的文章！',
    '这个思路很好，学到了很多，谢谢分享。',
    '写得很详细，建议可以出个系列，继续深入讲解。',
    '这篇文章真的很有帮助，谢谢分享！',
    '我觉得这个问题其实可以从另一个角度考虑。',
    '作者的观点很有意思，我自己也有类似的看法。',
    '完全同意作者的观点，希望能看到更多类似的文章。',
    '这个话题很有争议，大家可以多讨论。',
    '看完这篇文章后，我开始思考一些新的问题。',
    '这篇文章的视角很独特，希望作者继续深入这个话题。',
    '作者表达得很清晰，内容也很有深度。',
    '这个方法真的是我一直想要的，感谢分享！',
    '文章的内容非常详细，我收获很大。'
  ]

  // 技术相关话题
  const topics = [
    'Angular',
    'TypeScript',
    '前端开发',
    '性能优化',
    '组件设计',
    '状态管理',
    '响应式编程',
    '路由设计',
    '依赖注入',
    '单元测试',
    'CSS架构',
    '动画效果',
    '设计模式',
    '最佳实践',
    '工程化'
  ]

  // 生成随机用户名
  const generateUsername = () => {
    const surname = surnames[Math.floor(Math.random() * surnames.length)]
    const suffix = nicknameSuffixes[Math.floor(Math.random() * nicknameSuffixes.length)]
    return surname + suffix
  }

  // 生成随机评论内容
  const generateCommentText = () => {
    const template = commentTemplates[Math.floor(Math.random() * commentTemplates.length)]
    const topic = topics[Math.floor(Math.random() * topics.length)]
    return template.replace('{topic}', topic)
  }

  // 生成随机时间戳（最近30天内）
  const generateTimestamp = () => {
    const now = Date.now()
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000
    return now - Math.floor(Math.random() * thirtyDaysInMs)
  }

  // 生成随机头像哈希（用于生成不同的默认头像）
  const generateAvatarHash = () => {
    return Math.random().toString(36).substring(2, 15)
  }

  const comment: CommentData = {
    id,
    created: generateTimestamp(),
    text: generateCommentText(),
    author: {
      username: generateUsername(),
      avatar: `https://www.gravatar.com/avatar/${generateAvatarHash()}?d=identicon&s=64`
    },
    likes: Math.floor(Math.random() * 50),
    reply: 0
  }

  return comment
}

// 生成评论列表
export function generateCommentsList(): CommentData[] {
  return Array(Math.random() > 0.05 ? Math.floor(Math.random() * 10) + 2 : 0)
    .fill(0)
    .map((_, id) => generateRandomComment(id))
}

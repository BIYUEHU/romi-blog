interface ParsedMarkdown {
  content: string
  // biome-ignore lint:
  [key: string]: any
}

class MarkdownParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MarkdownParseError'
  }
}

export function parseMarkdown(markdown: string): ParsedMarkdown {
  // 检查是否有 frontmatter
  if (!markdown.startsWith('---\n')) {
    return { content: markdown }
  }

  // 查找第二个 --- 分隔符
  const endIndex = markdown.indexOf('\n---\n', 4)
  if (endIndex === -1) {
    throw new MarkdownParseError('Invalid frontmatter: missing closing delimiter')
  }

  const frontMatter = markdown.slice(4, endIndex)
  const content = markdown.slice(endIndex + 5)
  const result: ParsedMarkdown = { content: content.trim() }

  // 解析 frontmatter
  const lines = frontMatter.split('\n')
  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine) continue

    // 查找第一个冒号的位置
    const colonIndex = trimmedLine.indexOf(':')
    if (colonIndex === -1) {
      throw new MarkdownParseError(`Invalid frontmatter line: ${line}`)
    }

    const key = trimmedLine.slice(0, colonIndex).trim()
    let value = trimmedLine.slice(colonIndex + 1).trim()

    // 解析数组
    if (value.startsWith('[') && value.endsWith(']')) {
      try {
        // 处理字符串数组，支持带引号和不带引号的形式
        value = value.slice(1, -1).trim()
        if (!value) {
          result[key] = []
          continue
        }

        const items: string[] = []
        let currentItem = ''
        let inQuotes = false

        for (let i = 0; i < value.length; i++) {
          const char = value[i]

          if (char === '"' && (i === 0 || value[i - 1] !== '\\')) {
            inQuotes = !inQuotes
            continue
          }

          if (char === ',' && !inQuotes) {
            if (currentItem.trim()) {
              items.push(currentItem.trim().replace(/^"(.*)"$/, '$1'))
            }
            currentItem = ''
            continue
          }

          currentItem += char
        }

        if (currentItem.trim()) {
          items.push(currentItem.trim().replace(/^"(.*)"$/, '$1'))
        }

        result[key] = items
        continue
      } catch (e) {
        throw new MarkdownParseError(`Failed to parse array value: ${value}`)
      }
    }

    // 解析布尔值
    if (value === 'true' || value === 'false') {
      result[key] = value === 'true'
      continue
    }

    // 解析数字
    if (/^\d+$/.test(value)) {
      result[key] = Number.parseInt(value, 10)
      continue
    }

    // 处理带引号的字符串
    if (value.startsWith('"') && value.endsWith('"')) {
      result[key] = value.slice(1, -1)
      continue
    }

    // 其它情况当作普通字符串
    result[key] = value
  }

  return result
}

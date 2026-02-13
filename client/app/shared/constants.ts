import type { Configuration } from 'markdownlint'
import pkg from '../../../package.json'
import buildMeta from '../../environments/build-meta'
import { environment } from '../../environments/environment'
import { LoggerService } from '../services/logger.service'

// export const DEFAULT_TITLE = 'Romi Blog' // TODO

export const ROMI_METADATA = { pkg, build: buildMeta } //

export enum HEADER_CONTEXT {
  SKIP_BRING_TOKEN = 'Bring-Token',
  SKIP_ERROR_HANDLING = 'Error-Handling',
  ERROR_REDIRECT = 'Error-Redirect'
}

export const DEFAULT_LINT_CONFIG: Configuration = {
  // MD001: true, // 标题层级要递增
  // MD003: false, // 标题样式不限制
  // MD004: false, // 列表样式不限制
  // MD005: true, // 列表缩进要一致
  // MD007: false, // 列表缩进不严格
  // MD009: false, // 允许行尾空格
  // MD010: true, // 不允许硬制表符
  // MD011: true, // 检查反转链接
  // MD012: false, // 允许多个空行(博客常用)
  // MD013: false, // 不限制行长度
  // MD014: false, // shell 命令 $ 不限制
  // MD018: true, // # 后需要空格
  // MD019: true, // 标题前后不要多个 #
  // MD022: false, // 标题前后空行不严格
  // MD023: true, // 标题不要缩进
  MD024: false, // 允许重复标题(博客常用)
  // MD025: false, // 允许多个 h1
  // MD026: false, // 标题末尾标点不限制
  // MD027: true, // 块引用不要多余空格
  // MD028: false, // 块引用内空行不限制
  // MD029: false, // 有序列表序号不限制
  // MD030: true, // 列表标记后要空格
  // MD031: false, // 代码块前后空行不严格
  // MD032: false, // 列表前后空行不严格
  // MD033: false, // 允许内联 HTML(博客常用)
  // MD034: false, // 允许裸 URL
  // MD035: false, // 水平线样式不限制
  // MD036: false, // 允许强调代替标题
  // MD037: true, // 强调标记内不要空格
  // MD038: true, // 代码内不要多余空格
  // MD039: true, // 链接内不要空格
  // MD040: false, // 代码块语言不强制
  MD041: false // 首行不强制标题
  // MD042: true, // 不要空链接
  // MD043: false, // 不限制标题结构
  // MD044: false, // 大小写不限制
  // MD045: false, // 图片 alt 不强制
  // MD046: false, // 代码块样式不限制
  // MD047: false, // 文件末尾空行不强制
  // MD048: false, // 代码块样式不限制
  // MD049: false, // 强调样式不限制
  // MD050: false // 粗体样式不限制
}

;((): undefined => {
  if (typeof window === 'undefined') return
  const logger = new LoggerService()
  console.log(
    `%c Romi Blog %c v${ROMI_METADATA.pkg.version}`,
    'color: #fff; background: #d87cb6; padding:5px 0;font-size: 3em;font-weight: bold;',
    'color: #e094c5; background: #333; padding:5px;font-size: 3em;font-weight: bold;'
  )
  console.log(
    '%c Made With Love By Arimura Sena',
    'color: #e7acb4;background: #333; padding:5px;font-size: 2em;font-weight: bold;'
  )
  console.log(
    '%cAnyone who use ready-made blog frameworks or tools are all idiot without technical power!',
    'color: red; font-size: 1.7em; font-weight: bold;'
  )
  logger.info('The website is running on <magentaBright>Romi Blog</magentaBright>')
  logger.info(
    `Version: ${pkg.version} Hash: ${buildMeta.HASH} Build Time: ${new Date(buildMeta.BUILD_TIME).toISOString()}`
  )
  logger.info(`License: ${pkg.license} Author: ${pkg.author}`)
  logger.info('Open source: https://github.com/biyuehu/romi-blog')
  logger.debug(`API Base URL: ${environment.api_base_url}`)
  logger.record('<blueBright>Romi Blog is from the future, it shall end the old Web Blog era!</blueBright>')
  logger.record('<yellowBright>Fucking WordPress, Typecho, Hexo and more! PHP and templates is shit!</yellowBright>')
  logger.record(
    '<greenBright>Fucking Vue and React!</greenBright> <yellow>Angular and Lit (Web Components) is the future!</yellow>'
  )
  logger.record(
    '<cyanBright>Fucking SpringBoot, Django, Rails, Nest, Laravel!</cyanBright> <redBright>Axum and Rust is the future!</redBright>'
  )
  logger.record(
    '<whiteBright>Fucking C, CPP, Java, Python, CSharp, Golang! The future will belong to</whiteBright> <redBright>Rust and More Languages based on PLT and TT!</redBright>'
  )
  return
})()

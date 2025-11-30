import pkg from '../../../package.json'
import buildMeta from '../../environments/build-meta'
import { environment } from '../../environments/environment'
import { LoggerService } from '../services/logger.service'

export const DEFAULT_TITLE = 'Romi Blog' // TODO

export const ROMI_METADATA = { pkg, build: buildMeta } // TODO: Receive metadata from backend by http request

export enum HEADER_CONTEXT {
  SKIP_BRING_TOKEN = 'Bring-Token',
  SKIP_ERROR_HANDLING = 'Error-Handling',
  ERROR_REDIRECT = 'Error-Redirect'
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
    '<cyanBright>Fucking SpringBoot, Django, Rails, Nest, Laravel!</cyanBright> <redBright>Rocket and Rust is the future!</redBright>'
  )
  logger.record(
    '<whiteBright>Fucking C, CPP, Java, Python, CSharp, Golang! The future will belong to</whiteBright> <redBright>Rust and More Languages based on PLT and TT!</redBright>'
  )
  return
})()

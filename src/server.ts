import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { APP_BASE_HREF } from '@angular/common'
import { CommonEngine } from '@angular/ssr/node'
import express from 'express'
import bootstrap from '../client/main.server'

export function app(): express.Express {
  const serverDistFolder = dirname(fileURLToPath(import.meta.url))
  const browserDistFolder = resolve(serverDistFolder, '../browser')
  const indexHtml = join(serverDistFolder, 'index.server.html')
  const commonEngine = new CommonEngine()

  return express()
    .set('view engine', 'html')
    .set('views', browserDistFolder)
    .get(
      '**',
      express.static(browserDistFolder, {
        maxAge: '1y',
        index: 'index.html'
      })
    )
    .get('**', (req, res, next) => {
      commonEngine
        .render({
          bootstrap,
          documentFilePath: indexHtml,
          url: `${req.protocol}://${req.headers.host}${req.originalUrl}`,
          publicPath: browserDistFolder,
          providers: [{ provide: APP_BASE_HREF, useValue: req.baseUrl }]
        })
        .then((html) => res.send(html))
        .catch((err) => next(err))
    })
}

function run(): void {
  const port = (process.env as { PORT: string }).PORT ?? 8001
  app().listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`)
  })
}

run()

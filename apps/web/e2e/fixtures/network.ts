import { readFileSync } from 'node:fs'
import type { BrowserContext } from '@playwright/test'
import { mapStyle } from './map-style'

const tile = readFileSync(new URL('./land.pbf', import.meta.url))

type TdxResponder = (path: string, url: URL) => unknown

export async function mockNetwork(
  context: BrowserContext,
  baseURL: string | undefined,
  respondTdx: TdxResponder = () => [],
) {
  const unexpectedRequests: string[] = []
  let tileRequests = 0

  await context.route('**/*', async (route) => {
    const url = new URL(route.request().url())

    if (url.origin === baseURL) {
      if (url.pathname.startsWith('/api/tdx/')) {
        await route.fulfill({
          json: respondTdx(url.pathname.replace('/api/tdx', ''), url),
        })
      } else {
        await route.continue()
      }
      return
    }

    if (url.href === 'https://tiles.openfreemap.org/styles/positron') {
      await route.fulfill({ json: mapStyle })
      return
    }

    if (url.origin === 'https://fonts.googleapis.com') {
      await route.fulfill({ contentType: 'text/css', body: '' })
      return
    }

    if (
      url.origin === 'https://tiles.openfreemap.org' &&
      /^\/test\/\d+\/\d+\/\d+\.pbf$/.test(url.pathname)
    ) {
      tileRequests += 1
      await route.fulfill({
        contentType: 'application/x-protobuf',
        body: tile,
      })
      return
    }

    unexpectedRequests.push(url.href)
    await route.abort()
  })

  return {
    unexpectedRequests,
    getTileRequests: () => tileRequests,
  }
}

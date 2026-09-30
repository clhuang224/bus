import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { PNG } from 'pngjs'
import { mapStyle } from './fixtures/map-style'

const tile = readFileSync(new URL('./fixtures/land.pbf', import.meta.url))
const fillColor = mapStyle.layers[1].paint['fill-color']!
const expectedRgb = [1, 3, 5].map((offset) =>
  parseInt(fillColor.slice(offset, offset + 2), 16),
)

test('renders vector tiles with the production MapLibre worker', async ({
  page,
  context,
  baseURL,
}) => {
  const pageErrors: string[] = []
  const unexpectedRequests: string[] = []
  let tileRequests = 0
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await context.route('**/*', async (route) => {
    const url = new URL(route.request().url())

    if (url.origin === baseURL) {
      if (url.pathname.startsWith('/api/tdx/')) {
        await route.fulfill({ json: [] })
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

  await page.goto('/nearby')
  const canvas = page.getByRole('region', { name: 'Map', exact: true })
  await expect(canvas).toBeVisible()

  await expect
    .poll(
      async () => {
        const { data, width, height } = PNG.sync.read(await canvas.screenshot())
        let renderedPixels = 0

        for (let offset = 0; offset < data.length; offset += 4) {
          if (
            expectedRgb.every(
              (value, channel) => Math.abs(data[offset + channel] - value) <= 5,
            )
          ) {
            renderedPixels += 1
          }
        }

        return renderedPixels / (width * height)
      },
      {
        message: 'Vector tile fill must cover the map canvas',
        timeout: 15_000,
      },
    )
    .toBeGreaterThan(0.5)

  expect(tileRequests).toBeGreaterThan(0)
  expect(unexpectedRequests).toEqual([])
  expect(pageErrors).toEqual([])
})

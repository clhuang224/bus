import { expect, test } from '@playwright/test'
import { PNG } from 'pngjs'
import { mapStyle } from './fixtures/map-style'
import { mockNetwork } from './fixtures/network'

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
  page.on('pageerror', (error) => pageErrors.push(error.message))
  const { unexpectedRequests, getTileRequests } = await mockNetwork(
    context,
    baseURL,
  )

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

  expect(getTileRequests()).toBeGreaterThan(0)
  expect(unexpectedRequests).toEqual([])
  expect(pageErrors).toEqual([])
})

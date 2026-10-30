import { expect, test as base, type Page } from '@playwright/test'
import { zhTW } from '~/modules/i18n/locales/zh-TW'
import { mockNetwork } from './fixtures/network'
import {
  MANY_TABS_ROUTE_UID,
  NEARBY_STATION_COUNT,
  getNearbyStationName,
  getRouteStopName,
  ROUTE_GO_STOP_UID_PREFIX,
  ROUTE_STOP_COUNT,
  ROUTE_UID,
  respondTdx,
} from './fixtures/transit'

const STOP_TEST_ID_PREFIX = `route-stop-${ROUTE_GO_STOP_UID_PREFIX}`

const MAP_RENDER_TIMEOUT = { timeout: 15_000 }
const MIDDLE_NEARBY_STATION_ORDER = 8
const NO_REALTIME_MESSAGE =
  zhTW.translation.messages.routeRealtime.noRealtimeData.description
const ROUTE_STOP_MARKER_LABEL =
  zhTW.translation.components.routeMap.stopMarkerAriaLabel
const NEARBY_STOP_MARKER_LABEL =
  zhTW.translation.components.nearbyStopMap.stopMarkerAriaLabel

function fillCopy(template: string, values: Record<string, string | number>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    String(values[key]),
  )
}

function getRouteStopMarkerLabel(sequence: number) {
  return fillCopy(ROUTE_STOP_MARKER_LABEL, {
    stopName: getRouteStopName(sequence),
    sequence,
  })
}

function getNearbyStationMarkerLabel(stationName: string) {
  return fillCopy(NEARBY_STOP_MARKER_LABEL, { stopName: stationName })
}

interface ListGeometry {
  viewportTop: number
  viewportBottom: number
  contentTop: number
  itemTop: number
  itemBottom: number
}

const test = base.extend<{ mockedTransit: void }>({
  mockedTransit: [
    async ({ page, context, baseURL }, use) => {
      const pageErrors: string[] = []
      page.on('pageerror', (error) => pageErrors.push(error.message))
      const { unexpectedRequests } = await mockNetwork(
        context,
        baseURL,
        respondTdx,
      )

      await use()

      expect(unexpectedRequests).toEqual([])
      expect(pageErrors).toEqual([])
    },
    { auto: true },
  ],
})

test.use({
  viewport: { width: 375, height: 812 },
  hasTouch: true,
  isMobile: true,
})

function sheetListViewport(page: Page) {
  return page.locator('[data-vaul-drawer] .mantine-ScrollArea-viewport').first()
}

async function getListGeometry(
  page: Page,
  itemSelector: string,
): Promise<ListGeometry> {
  return sheetListViewport(page).evaluate((viewport, selector) => {
    const viewportRect = viewport.getBoundingClientRect()
    const item = viewport.querySelector(selector)
    if (!item) throw new Error(`Missing list item ${selector}`)

    const itemRect = item.getBoundingClientRect()
    const stickyTabs = viewport.querySelector('[role="tablist"]')

    return {
      viewportTop: viewportRect.top,
      viewportBottom: viewportRect.bottom,
      contentTop: stickyTabs
        ? stickyTabs.getBoundingClientRect().bottom
        : viewportRect.top,
      itemTop: itemRect.top,
      itemBottom: itemRect.bottom,
    }
  }, itemSelector)
}

function isFullyVisible(geometry: ListGeometry) {
  return (
    geometry.itemTop >= geometry.contentTop - 1 &&
    geometry.itemBottom <= geometry.viewportBottom + 1
  )
}

function mapMarker(page: Page, label: string) {
  return page.locator(`.maplibregl-marker[aria-label="${label}"]`)
}

function routeStopSelector(sequence: number) {
  return `[data-testid="${STOP_TEST_ID_PREFIX}${sequence}"]`
}

async function waitForSheetToSettle(page: Page) {
  const sheet = page.locator('[data-vaul-drawer]')
  let previousTop = Number.NaN

  await expect
    .poll(async () => {
      const top = (await sheet.boundingBox())?.y ?? Number.NaN
      const isSettled = top === previousTop
      previousTop = top
      return isSettled
    })
    .toBe(true)
}

async function openRoutePage(page: Page, routeUID = ROUTE_UID) {
  await page.goto(`/routes/Taipei/${routeUID}`)
  await expect(page.getByText(NO_REALTIME_MESSAGE)).toBeAttached()
  await waitForSheetToSettle(page)
}

async function expandSheet(page: Page) {
  await page.locator('[data-vaul-handle]').click()
  await waitForSheetToSettle(page)
}

async function readLastTappableMarkerLabel(
  page: Page,
  candidateLabels: string[],
) {
  return page.evaluate((candidateLabels) => {
    const sheetTop = document
      .querySelector('[data-vaul-drawer]')!
      .getBoundingClientRect().top
    const headerBottom = document
      .querySelector('header')!
      .getBoundingClientRect().bottom
    const tappableLabels = new Set(
      [
        ...document.querySelectorAll<HTMLElement>(
          '.maplibregl-marker[role="button"]',
        ),
      ]
        .filter((marker) => {
          const rect = marker.getBoundingClientRect()
          return (
            marker.style.display !== 'none' &&
            rect.top > headerBottom &&
            rect.bottom < sheetTop &&
            rect.left >= 0 &&
            rect.right <= window.innerWidth
          )
        })
        .map((marker) => marker.ariaLabel),
    )

    return [...candidateLabels]
      .reverse()
      .find((label) => tappableLabels.has(label))
  }, candidateLabels)
}

async function findLastTappableMarkerLabel(
  page: Page,
  candidateLabels: string[],
) {
  let label: string | undefined

  await expect
    .poll(async () => {
      label = await readLastTappableMarkerLabel(page, candidateLabels)
      return label
    }, MAP_RENDER_TIMEOUT)
    .toBeDefined()

  return label!
}

test.describe('route page bottom sheet', () => {
  test('keeps a stop picked from the list in view after the sheet collapses', async ({
    page,
  }) => {
    await openRoutePage(page)

    await sheetListViewport(page).evaluate((viewport) => {
      viewport.scrollTop = 600
    })
    const targetSequence = await sheetListViewport(page).evaluate(
      (viewport, prefix) => {
        const viewportRect = viewport.getBoundingClientRect()
        const lastVisibleItem = [
          ...viewport.querySelectorAll<HTMLElement>(
            `[data-testid^="${prefix}"]`,
          ),
        ]
          .filter((item) => {
            const rect = item.getBoundingClientRect()
            return (
              rect.top >= viewportRect.top &&
              rect.top < viewportRect.bottom - 40
            )
          })
          .at(-1)

        return Number(lastVisibleItem!.dataset.testid!.slice(prefix.length))
      },
      STOP_TEST_ID_PREFIX,
    )

    await page
      .getByText(getRouteStopName(targetSequence), { exact: true })
      .click()
    await waitForSheetToSettle(page)

    await expect
      .poll(async () => {
        const geometry = await getListGeometry(
          page,
          routeStopSelector(targetSequence),
        )
        return (
          geometry.itemTop >= geometry.contentTop - 1 &&
          geometry.itemTop < geometry.viewportBottom
        )
      })
      .toBe(true)

    await expandSheet(page)

    await expect
      .poll(async () =>
        isFullyVisible(
          await getListGeometry(page, routeStopSelector(targetSequence)),
        ),
      )
      .toBe(true)
  })

  test('scrolls the list to a stop tapped on the map at half and full height', async ({
    page,
  }) => {
    await openRoutePage(page)

    const stopMarkerLabels = Array.from(
      { length: ROUTE_STOP_COUNT },
      (_, index) => getRouteStopMarkerLabel(index + 1),
    )
    const markerLabel = await findLastTappableMarkerLabel(
      page,
      stopMarkerLabels,
    )
    const targetSequence = stopMarkerLabels.indexOf(markerLabel) + 1
    expect(targetSequence).toBeGreaterThan(5)

    await mapMarker(page, markerLabel).click()

    await expect
      .poll(async () =>
        isFullyVisible(
          await getListGeometry(page, routeStopSelector(targetSequence)),
        ),
      )
      .toBe(true)

    await expandSheet(page)

    await expect
      .poll(async () =>
        isFullyVisible(
          await getListGeometry(page, routeStopSelector(targetSequence)),
        ),
      )
      .toBe(true)
  })

  test('keeps the panel from scrolling sideways when a route has many tabs', async ({
    page,
  }) => {
    await openRoutePage(page, MANY_TABS_ROUTE_UID)
    await expect(page.getByRole('tab')).toHaveCount(20)

    const widths = await sheetListViewport(page).evaluate((viewport) => {
      const tabList = viewport.querySelector('[role="tablist"]')!

      return {
        viewportClientWidth: viewport.clientWidth,
        viewportScrollWidth: viewport.scrollWidth,
        tabListClientWidth: tabList.clientWidth,
        tabListScrollWidth: tabList.scrollWidth,
        pageScrollWidth: document.documentElement.scrollWidth,
      }
    })

    expect(widths.viewportScrollWidth).toBeLessThanOrEqual(
      widths.viewportClientWidth,
    )
    expect(widths.tabListScrollWidth).toBeGreaterThan(widths.tabListClientWidth)
    expect(widths.pageScrollWidth).toBeLessThanOrEqual(375)
  })

  for (const height of [812, 400]) {
    test(`keeps the last stop reachable above the footer at ${height}px tall`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height })
      await openRoutePage(page)

      await sheetListViewport(page).evaluate((viewport) => {
        viewport.scrollTop = viewport.scrollHeight
      })

      const geometry = await getListGeometry(
        page,
        routeStopSelector(ROUTE_STOP_COUNT),
      )
      const footerTop = (await page.locator('footer').boundingBox())!.y

      expect(geometry.itemBottom).toBeLessThanOrEqual(
        geometry.viewportBottom + 1,
      )
      expect(geometry.viewportBottom).toBeLessThanOrEqual(footerTop + 1)
    })
  }
})

test.describe('nearby page bottom sheet', () => {
  test('scrolls the list to a station tapped on the map', async ({ page }) => {
    const stationName = getNearbyStationName(MIDDLE_NEARBY_STATION_ORDER)
    const stationMarker = mapMarker(
      page,
      getNearbyStationMarkerLabel(stationName),
    )
    const expandedStation = sheetListViewport(page).locator(
      '[data-accordion-control][aria-expanded="true"]',
    )

    await page.goto('/nearby')
    await expect(page.getByRole('button', { name: stationName })).toBeAttached()
    await waitForSheetToSettle(page)
    await expect(
      page.getByRole('button', { name: stationName }),
    ).not.toBeInViewport()

    await expect(stationMarker).toBeInViewport(MAP_RENDER_TIMEOUT)
    await stationMarker.click()

    await expect(expandedStation).toContainText(stationName)
    await expect
      .poll(async () =>
        isFullyVisible(
          await getListGeometry(
            page,
            '[data-accordion-control][aria-expanded="true"]',
          ),
        ),
      )
      .toBe(true)
  })

  test('leaves the list where the user scrolled it', async ({ page }) => {
    await page.goto('/nearby')
    await expect(
      page.getByRole('button', {
        name: getNearbyStationName(NEARBY_STATION_COUNT),
      }),
    ).toBeAttached()
    await waitForSheetToSettle(page)

    await sheetListViewport(page).evaluate((viewport) => {
      viewport.scrollTop = 120
    })
    const scrollTop = await sheetListViewport(page).evaluate(
      (viewport) => viewport.scrollTop,
    )
    expect(scrollTop).toBeGreaterThan(0)

    await page.waitForTimeout(2_000)

    expect(
      await sheetListViewport(page).evaluate((viewport) => viewport.scrollTop),
    ).toBe(scrollTop)
    await expect(
      sheetListViewport(page).locator('[aria-expanded="true"]'),
    ).toHaveCount(0)
  })
})

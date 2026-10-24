// @vitest-environment jsdom

import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { LatLng } from '~/modules/types/CoordsType'
import { useNearbySearchCoords } from './useNearbySearchCoords'

const startCoords: LatLng = [25.033, 121.5654]
const coordsAboutTenMetersAway: LatLng = [25.03309, 121.5654]
const coordsAboutTwoHundredMetersAway: LatLng = [25.0348, 121.5654]

describe('useNearbySearchCoords', () => {
  it('keeps the search coordinates while the location only jitters', () => {
    const { result, rerender } = renderHook(
      ({ coords }) => useNearbySearchCoords(coords),
      { initialProps: { coords: startCoords } },
    )

    rerender({ coords: coordsAboutTenMetersAway })

    expect(result.current).toBe(startCoords)
  })

  it('moves the search coordinates once the location moves past the threshold', () => {
    const { result, rerender } = renderHook(
      ({ coords }) => useNearbySearchCoords(coords),
      { initialProps: { coords: startCoords } },
    )

    rerender({ coords: coordsAboutTwoHundredMetersAway })

    expect(result.current).toBe(coordsAboutTwoHundredMetersAway)
  })

  it('follows the location when it becomes available or unavailable', () => {
    const { result, rerender } = renderHook(
      ({ coords }: { coords: LatLng | null }) => useNearbySearchCoords(coords),
      { initialProps: { coords: null as LatLng | null } },
    )

    rerender({ coords: startCoords })
    expect(result.current).toBe(startCoords)

    rerender({ coords: null })
    expect(result.current).toBeNull()
  })
})

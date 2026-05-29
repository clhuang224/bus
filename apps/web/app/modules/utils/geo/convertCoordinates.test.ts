import { describe, expect, it } from 'vitest'
import { toLatLng, toLngLat } from './convertCoordinates'

describe('convertCoordinates', () => {
  it('converts lng-lat tuples into lat-lng tuples', () => {
    expect(toLatLng([121.5654, 25.033])).toEqual([25.033, 121.5654])
  })

  it('converts lat-lng tuples into lng-lat tuples', () => {
    expect(toLngLat([25.033, 121.5654])).toEqual([121.5654, 25.033])
  })

  it('returns null when coordinates are missing', () => {
    expect(toLatLng(null)).toBeNull()
    expect(toLngLat(null)).toBeNull()
  })
})
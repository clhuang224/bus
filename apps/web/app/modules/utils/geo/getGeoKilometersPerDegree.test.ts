import { describe, expect, it } from 'vitest'
import { getLatitudeKilometersPerDegree, getLongitudeKilometersPerDegree } from './getGeoKilometersPerDegree'

describe('getGeoKilometersPerDegree', () => {
  it('returns the approximate kilometers per degree of latitude', () => {
    expect(getLatitudeKilometersPerDegree()).toBe(111.32)
  })

  it('returns fewer longitude kilometers per degree as latitude increases', () => {
    expect(getLongitudeKilometersPerDegree(25)).toBeLessThan(getLongitudeKilometersPerDegree(0))
  })
})

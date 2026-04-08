import { describe, expect, it } from 'vitest'
import { CityNameType } from '../../enums/CityNameType'
import { isCityName } from './isCityName'

describe('isCityName', () => {
  it('returns true for valid city names', () => {
    expect(isCityName(CityNameType.TAIPEI)).toBe(true)
    expect(isCityName(CityNameType.NEW_TAIPEI)).toBe(true)
  })

  it('returns false for invalid values', () => {
    expect(isCityName('Taipei City')).toBe(false)
    expect(isCityName('')).toBe(false)
    expect(isCityName(null)).toBe(false)
    expect(isCityName(undefined)).toBe(false)
  })
})

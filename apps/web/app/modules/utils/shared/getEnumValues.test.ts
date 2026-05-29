import { describe, expect, it } from 'vitest'
import { getEnumValues } from './getEnumValues'

enum StringEnum {
  TAIPEI = 'Taipei',
  TAICHUNG = 'Taichung'
}

enum NumericEnum {
  ZERO,
  ONE
}

describe('getEnumValues', () => {
  it('returns all values from a string enum', () => {
    expect(getEnumValues(StringEnum)).toEqual(['Taipei', 'Taichung'])
  })

  it('filters out reverse-mapped keys from a numeric enum', () => {
    expect(getEnumValues(NumericEnum)).toEqual([0, 1])
  })
})

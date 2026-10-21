import { describe, expect, it } from 'vitest'
import { keepTdxRecords } from './keepTdxRecords'

const isNamedRecord = (value: unknown): value is { name: string } =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as { name?: unknown }).name === 'string'

describe('keepTdxRecords', () => {
  it('keeps only records with the expected shape', () => {
    expect(
      keepTdxRecords([{ name: 'a' }, { name: 1 }, null], isNamedRecord),
    ).toEqual([{ name: 'a' }])
  })

  it('throws when the response is not an array', () => {
    expect(() =>
      keepTdxRecords({ message: 'Service unavailable' }, isNamedRecord),
    ).toThrow('Expected the TDX response to be an array.')
  })
})

import { CityNameType } from '@bus/shared'
import { resolveSyncCities } from './sync-cities.js'

describe('resolveSyncCities', () => {
  const originalSyncCities = process.env.SYNC_CITIES

  afterEach(() => {
    if (originalSyncCities === undefined) delete process.env.SYNC_CITIES
    else process.env.SYNC_CITIES = originalSyncCities
  })

  it('uses all cities by default', () => {
    delete process.env.SYNC_CITIES

    expect(resolveSyncCities()).toContain(CityNameType.TAIPEI)
    expect(resolveSyncCities()).toContain(CityNameType.NEW_TAIPEI)
  })

  it('uses the configured city list', () => {
    process.env.SYNC_CITIES = 'Taipei, NewTaipei,Taipei'

    expect(resolveSyncCities()).toEqual([
      CityNameType.TAIPEI,
      CityNameType.NEW_TAIPEI,
    ])
  })

  it('rejects unknown city names', () => {
    process.env.SYNC_CITIES = 'Taipei,UnknownCity'

    expect(() => resolveSyncCities()).toThrow(
      'Invalid SYNC_CITIES value "UnknownCity".',
    )
  })
})

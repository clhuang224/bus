import { describe, expect, it } from 'vitest'
import { CityNameType } from '../enums/CityNameType'
import { buildNearbyStopQuery, getNearbyStopBounds } from './buildNearbyStopQuery'

describe('buildNearbyStopQuery', () => {
  it('builds bounded coordinates around the current position', () => {
    expect(getNearbyStopBounds([25.033, 121.5654])).toEqual({
      latitudeMin: expect.any(Number),
      latitudeMax: expect.any(Number),
      longitudeMin: expect.any(Number),
      longitudeMax: expect.any(Number)
    })
  })

  it('builds a stop query with select, filter, and format parameters', () => {
    const query = buildNearbyStopQuery(CityNameType.NEW_TAIPEI, [25.033, 121.5654])

    expect(query).toContain('/Stop/City/NewTaipei?')
    expect(query).toContain('%24select=')
    expect(query).toContain('StopPosition%2FPositionLat')
    expect(query).toContain('StopPosition%2FPositionLon')
    expect(query).toContain('%24format=JSON')
  })
})

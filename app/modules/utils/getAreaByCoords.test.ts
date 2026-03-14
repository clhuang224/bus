import { describe, expect, it } from 'vitest'
import type { FeatureCollection } from 'geojson'
import { AreaType } from '../enums/AreaType'
import { CityNameType } from '../enums/CityNameType'
import { getAreaByCoords } from './getAreaByCoords'

const mockGeojson: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        name: CityNameType.NEW_TAIPEI,
        nameTw: '新北市'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [121.3, 24.9],
          [121.7, 24.9],
          [121.7, 25.2],
          [121.3, 25.2],
          [121.3, 24.9]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        name: CityNameType.CHIAYI_COUNTY,
        nameTw: '嘉義縣'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [120.2, 23.3],
          [120.8, 23.3],
          [120.8, 23.7],
          [120.2, 23.7],
          [120.2, 23.3]
        ]]
      }
    }
  ]
}

describe('getAreaByCoords', () => {
  it('maps a detected TDX city to the expected area', () => {
    expect(getAreaByCoords([25.05, 121.55], mockGeojson)).toBe(AreaType.TAIPEI)
    expect(getAreaByCoords([23.5, 120.5], mockGeojson)).toBe(AreaType.CHIAYI)
  })

  it('falls back to Taipei when city lookup falls back', () => {
    expect(getAreaByCoords(null, mockGeojson)).toBe(AreaType.TAIPEI)
    expect(getAreaByCoords([22.0, 121.0], mockGeojson)).toBe(AreaType.TAIPEI)
  })
})

import { describe, expect, it, vi } from 'vitest'
import type { FeatureCollection } from 'geojson'
import { CityNameType } from '../enums/CityNameType'
import { DEFAULT_CITY, getCityByCoords } from './getCityByCoords'

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
        name: CityNameType.TAIPEI,
        nameTw: '台北市'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [121.4, 25.0],
          [121.7, 25.0],
          [121.7, 25.2],
          [121.4, 25.2],
          [121.4, 25.0]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        name: CityNameType.YILAN_COUNTY,
        nameTw: '宜蘭縣'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [121.6, 24.5],
          [121.9, 24.5],
          [121.9, 24.8],
          [121.6, 24.8],
          [121.6, 24.5]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        name: 'UnknownCity',
        nameTw: '未知縣市'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [121.9, 24.9],
          [122.1, 24.9],
          [122.1, 25.1],
          [121.9, 25.1],
          [121.9, 24.9]
        ]]
      }
    }
  ]
}

describe('getCityByCoords', () => {
  it('returns the default city when coords or geojson are missing', () => {
    expect(getCityByCoords(null, mockGeojson)).toBe(DEFAULT_CITY)
    expect(getCityByCoords([25.04, 121.56], null)).toBe(DEFAULT_CITY)
  })

  it('returns the first matching known city when polygons overlap', () => {
    expect(getCityByCoords([25.05, 121.55], mockGeojson)).toBe(CityNameType.NEW_TAIPEI)
  })

  it('treats a point on the polygon boundary as inside the city', () => {
    expect(getCityByCoords([24.5, 121.75], mockGeojson)).toBe(CityNameType.YILAN_COUNTY)
  })

  it('ignores unknown city names in geojson', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect(getCityByCoords([25.05, 121.95], mockGeojson)).toBe(DEFAULT_CITY)
    expect(warnSpy).toHaveBeenCalledOnce()

    warnSpy.mockRestore()
  })

  it('still resolves a known city when unknown city names exist in geojson', () => {
    expect(getCityByCoords([25.05, 121.55], mockGeojson)).toBe(CityNameType.NEW_TAIPEI)
  })

  it('resolves a known city even when it is not one of the previously prioritized cities', () => {
    expect(getCityByCoords([24.65, 121.75], mockGeojson)).toBe(CityNameType.YILAN_COUNTY)
  })

  it('ignores unknown city names and falls back when no known polygon matches', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect(getCityByCoords([25.0, 122.0], mockGeojson)).toBe(DEFAULT_CITY)
    expect(warnSpy).toHaveBeenCalledOnce()

    warnSpy.mockRestore()
  })
})

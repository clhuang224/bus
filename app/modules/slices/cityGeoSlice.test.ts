import type { FeatureCollection } from 'geojson'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchCityGeoJSON, setGeoJSON, setLoading } from './cityGeoSlice'

const {
  mockFeature,
  mockReadCityGeoCache,
  mockWriteCityGeoCache
} = vi.hoisted(() => ({
  mockFeature: vi.fn(),
  mockReadCityGeoCache: vi.fn(),
  mockWriteCityGeoCache: vi.fn()
}))

vi.mock('topojson-client', () => ({
  feature: mockFeature
}))

vi.mock('../utils/geo/cityGeoPersistence', () => ({
  readCityGeoCache: mockReadCityGeoCache,
  writeCityGeoCache: mockWriteCityGeoCache
}))

const mockGeoJson: FeatureCollection = {
  type: 'FeatureCollection',
  features: []
}

describe('cityGeoSlice', () => {
  beforeEach(() => {
    mockFeature.mockReset()
    mockReadCityGeoCache.mockReset()
    mockWriteCityGeoCache.mockReset()
    vi.restoreAllMocks()
  })

  it('writes fetched city geo data into IndexedDB cache with metadata', async () => {
    const dispatch = vi.fn()
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        objects: {
          counties: {}
        }
      })
    } as Response)

    mockFeature.mockReturnValue(mockGeoJson)
    mockReadCityGeoCache.mockResolvedValue(null)

    await fetchCityGeoJSON()(dispatch as never)

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(dispatch).toHaveBeenNthCalledWith(1, setLoading(true))
    expect(dispatch).toHaveBeenNthCalledWith(2, setGeoJSON(mockGeoJson))
    expect(mockWriteCityGeoCache).toHaveBeenCalledWith({
      geojson: mockGeoJson,
      updatedAt: expect.any(String)
    })
  })

  it('loads IndexedDB cache before fetching fresh city geo data', async () => {
    const dispatch = vi.fn()
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        objects: {
          counties: {}
        }
      })
    } as Response)

    mockReadCityGeoCache.mockResolvedValue({
      geojson: mockGeoJson,
      updatedAt: '2026-04-11T00:00:00.000Z'
    })
    mockFeature.mockReturnValue(mockGeoJson)

    await fetchCityGeoJSON()(dispatch as never)

    expect(mockReadCityGeoCache).toHaveBeenCalledOnce()
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(dispatch).toHaveBeenNthCalledWith(1, setGeoJSON(mockGeoJson))
    expect(dispatch).toHaveBeenNthCalledWith(2, setGeoJSON(mockGeoJson))
  })

  it('keeps cached city geo data in state when background fetch fails', async () => {
    const dispatch = vi.fn()
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'))

    mockReadCityGeoCache.mockResolvedValue({
      geojson: mockGeoJson,
      updatedAt: '2026-04-11T00:00:00.000Z'
    })

    await fetchCityGeoJSON()(dispatch as never)

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(mockReadCityGeoCache).toHaveBeenCalledOnce()
    expect(dispatch).toHaveBeenCalledTimes(1)
    expect(dispatch).toHaveBeenNthCalledWith(1, setGeoJSON(mockGeoJson))
  })

  it('sets loading before fetch when no local cache exists', async () => {
    const dispatch = vi.fn()
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        objects: {
          counties: {}
        }
      })
    } as Response)

    mockReadCityGeoCache.mockResolvedValue(null)
    mockFeature.mockReturnValue(mockGeoJson)

    await fetchCityGeoJSON()(dispatch as never)

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(dispatch).toHaveBeenNthCalledWith(1, setLoading(true))
    expect(dispatch).toHaveBeenNthCalledWith(2, setGeoJSON(mockGeoJson))
  })
})

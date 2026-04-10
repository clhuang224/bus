import type { FeatureCollection } from 'geojson'
import type { Topology } from 'topojson-specification'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchCityGeoJSON, setGeoJSON, setLoading } from './cityGeoSlice'

const {
  mockFeature,
  mockReadCityBoundaryCache,
  mockWriteCityBoundaryCache
} = vi.hoisted(() => ({
  mockFeature: vi.fn(),
  mockReadCityBoundaryCache: vi.fn(),
  mockWriteCityBoundaryCache: vi.fn()
}))

vi.mock('topojson-client', () => ({
  feature: mockFeature
}))

vi.mock('../utils/geo/cityBoundaryIndexedDB', () => ({
  readCityBoundaryCache: mockReadCityBoundaryCache,
  writeCityBoundaryCache: mockWriteCityBoundaryCache
}))

const mockGeoJson: FeatureCollection = {
  type: 'FeatureCollection',
  features: []
}

const mockTopoJson: Topology = {
  type: 'Topology',
  objects: {
    counties: {
      type: 'GeometryCollection',
      geometries: []
    }
  },
  arcs: [],
  transform: {
    scale: [1, 1],
    translate: [0, 0]
  }
}

describe('cityGeoSlice', () => {
  beforeEach(() => {
    mockFeature.mockReset()
    mockReadCityBoundaryCache.mockReset()
    mockWriteCityBoundaryCache.mockReset()
    vi.restoreAllMocks()
  })

  it('writes fetched city geo data into IndexedDB cache with metadata', async () => {
    const dispatch = vi.fn()
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => mockTopoJson
    } as Response)

    mockFeature.mockReturnValue(mockGeoJson)
    mockReadCityBoundaryCache.mockResolvedValue(null)

    await fetchCityGeoJSON()(dispatch as never)

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(dispatch).toHaveBeenNthCalledWith(1, setLoading(true))
    expect(dispatch).toHaveBeenNthCalledWith(2, setGeoJSON(mockGeoJson))
    expect(mockFeature).toHaveBeenCalledWith(mockTopoJson, mockTopoJson.objects.counties)
    expect(mockWriteCityBoundaryCache).toHaveBeenCalledWith({
      topojson: mockTopoJson,
      updatedAt: expect.any(String)
    })
  })

  it('loads IndexedDB cache before fetching fresh city geo data', async () => {
    const dispatch = vi.fn()
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => mockTopoJson
    } as Response)

    mockReadCityBoundaryCache.mockResolvedValue({
      topojson: mockTopoJson,
      updatedAt: '2026-04-11T00:00:00.000Z'
    })
    mockFeature.mockReturnValue(mockGeoJson)

    await fetchCityGeoJSON()(dispatch as never)

    expect(mockReadCityBoundaryCache).toHaveBeenCalledOnce()
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(mockFeature).toHaveBeenNthCalledWith(1, mockTopoJson, mockTopoJson.objects.counties)
    expect(mockFeature).toHaveBeenNthCalledWith(2, mockTopoJson, mockTopoJson.objects.counties)
    expect(dispatch).toHaveBeenNthCalledWith(1, setGeoJSON(mockGeoJson))
    expect(dispatch).toHaveBeenNthCalledWith(2, setGeoJSON(mockGeoJson))
  })

  it('keeps cached city geo data in state when background fetch fails', async () => {
    const dispatch = vi.fn()
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'))

    mockReadCityBoundaryCache.mockResolvedValue({
      topojson: mockTopoJson,
      updatedAt: '2026-04-11T00:00:00.000Z'
    })
    mockFeature.mockReturnValue(mockGeoJson)

    await fetchCityGeoJSON()(dispatch as never)

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(mockReadCityBoundaryCache).toHaveBeenCalledOnce()
    expect(mockFeature).toHaveBeenCalledOnce()
    expect(mockFeature).toHaveBeenCalledWith(mockTopoJson, mockTopoJson.objects.counties)
    expect(dispatch).toHaveBeenCalledTimes(1)
    expect(dispatch).toHaveBeenNthCalledWith(1, setGeoJSON(mockGeoJson))
  })

  it('sets loading before fetch when no local cache exists', async () => {
    const dispatch = vi.fn()
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => mockTopoJson
    } as Response)

    mockReadCityBoundaryCache.mockResolvedValue(null)
    mockFeature.mockReturnValue(mockGeoJson)

    await fetchCityGeoJSON()(dispatch as never)

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(dispatch).toHaveBeenNthCalledWith(1, setLoading(true))
    expect(dispatch).toHaveBeenNthCalledWith(2, setGeoJSON(mockGeoJson))
  })
})

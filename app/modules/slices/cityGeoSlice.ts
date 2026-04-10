import { createSlice } from '@reduxjs/toolkit'
import { feature } from 'topojson-client'
import type { FeatureCollection } from 'geojson'
import type { Topology } from 'topojson-specification'
import type { AppDispatch } from '../store'
import { readCityBoundaryCache, writeCityBoundaryCache } from '../utils/geo/cityBoundaryIndexedDB'
import cityBoundaryAssetUrl from '../assets/taiwan-counties-10t.json?url'

export interface CityGeoState {
  geojson: FeatureCollection | null
  loading: boolean
  error: string | null
}

const CITY_BOUNDARY_MISSING_COUNTIES_ERROR = 'City boundary TopoJSON is missing objects.counties.'
const CITY_BOUNDARY_INVALID_FEATURE_COLLECTION_ERROR = 'City boundary TopoJSON is not a FeatureCollection.'
const CITY_BOUNDARY_CACHE_MISS_ERROR = 'City boundary cache miss.'
const CITY_BOUNDARY_ASSET_LOAD_ERROR = 'Failed to load city boundary asset.'
export const CITY_BOUNDARY_LOAD_ERROR = 'Failed to load city boundary data.'

const initialState: CityGeoState = {
  geojson: null,
  loading: false,
  error: null
}

const cityGeoSlice = createSlice({
  name: 'cityGeo',
  initialState,
  reducers: {
    setGeoJSON(state, action) {
      state.geojson = action.payload
      state.loading = false
      state.error = null
    },
    setLoading(state, action) {
      state.loading = action.payload
    },
    setError(state, action) {
      state.error = action.payload
      state.loading = false
    }
  }
})

export const { setGeoJSON, setLoading, setError } = cityGeoSlice.actions

function convertCityBoundaryToGeoJSON(topo: Topology): FeatureCollection {
  const counties = topo.objects?.counties
  if (!counties) throw new Error(CITY_BOUNDARY_MISSING_COUNTIES_ERROR)

  const geo = feature(topo, counties)
  if (geo.type !== 'FeatureCollection') throw new Error(CITY_BOUNDARY_INVALID_FEATURE_COLLECTION_ERROR)

  return geo
}

async function loadCityBoundaryFromCache() {
  const cachedCityBoundary = await readCityBoundaryCache()

  if (!cachedCityBoundary) throw new Error(CITY_BOUNDARY_CACHE_MISS_ERROR)

  return {
    ...cachedCityBoundary,
    geojson: convertCityBoundaryToGeoJSON(cachedCityBoundary.topojson)
  }
}

async function loadCityBoundaryFromAsset() {
  const res = await fetch(cityBoundaryAssetUrl)

  if (!res.ok) throw new Error(CITY_BOUNDARY_ASSET_LOAD_ERROR)

  return res.json() as Promise<Topology>
}

async function cacheCityBoundary(topojson: Topology) {
  await writeCityBoundaryCache({
    topojson,
    assetUrl: cityBoundaryAssetUrl,
    updatedAt: new Date().toISOString()
  })
}

async function refreshCityBoundaryFromAsset(dispatch: AppDispatch) {
  const topo = await loadCityBoundaryFromAsset()
  const geo = convertCityBoundaryToGeoJSON(topo)

  dispatch(setGeoJSON(geo))

  try {
    await cacheCityBoundary(topo)
  } catch (err) {
    console.warn('fetchCityGeoJSON cache write failed:', err)
  }
}

function isCurrentCityBoundaryCache(assetUrl: string | undefined) {
  return assetUrl === cityBoundaryAssetUrl
}

export const fetchCityGeoJSON = () => async (dispatch: AppDispatch) => {
  try {
    const cachedCityBoundary = await loadCityBoundaryFromCache()

    dispatch(setGeoJSON(cachedCityBoundary.geojson))

    if (isCurrentCityBoundaryCache(cachedCityBoundary.assetUrl)) {
      return
    }

    try {
      await refreshCityBoundaryFromAsset(dispatch)
    } catch (err) {
      console.error('fetchCityGeoJSON refresh after cache hit failed:', err)
    }

    return
  } catch (err) {
    console.warn('fetchCityGeoJSON cache unavailable, falling back to asset:', err)
  }

  dispatch(setLoading(true))

  try {
    await refreshCityBoundaryFromAsset(dispatch)
  } catch (err) {
    console.error('fetchCityGeoJSON error:', err)
    dispatch(setError(CITY_BOUNDARY_LOAD_ERROR))
  }
}

export default cityGeoSlice

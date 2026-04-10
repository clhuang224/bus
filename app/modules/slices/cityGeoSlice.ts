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
  const geo = feature(topo, topo.objects.counties)

  if (geo.type !== 'FeatureCollection') {
    throw new Error('Fetched TopoJSON is not a FeatureCollection.')
  }

  return geo
}

async function loadCityBoundaryFromCache() {
  const cachedCityBoundary = await readCityBoundaryCache()

  if (!cachedCityBoundary) {
    return null
  }

  return {
    ...cachedCityBoundary,
    geojson: convertCityBoundaryToGeoJSON(cachedCityBoundary.topojson)
  }
}

async function loadCityBoundaryFromAsset() {
  const res = await fetch(cityBoundaryAssetUrl)

  if (!res.ok) {
    throw new Error('Failed to load city boundary asset.')
  }

  return res.json() as Promise<Topology>
}

async function cacheCityBoundary(topojson: Topology) {
  await writeCityBoundaryCache({
    topojson,
    updatedAt: new Date().toISOString()
  })
}

export const fetchCityGeoJSON = () => async (dispatch: AppDispatch) => {
  const cachedCityBoundary = await loadCityBoundaryFromCache()

  if (cachedCityBoundary) {
    dispatch(setGeoJSON(cachedCityBoundary.geojson))
  } else {
    dispatch(setLoading(true))
  }

  try {
    const topo = await loadCityBoundaryFromAsset()
    const geo = convertCityBoundaryToGeoJSON(topo)

    dispatch(setGeoJSON(geo))
    await cacheCityBoundary(topo)
  } catch (err) {
    console.error('fetchCityGeoJSON error:', err)

    if (cachedCityBoundary) {
      return
    }

    dispatch(setError('Failed to load city boundary data.'))
  }
}

export default cityGeoSlice

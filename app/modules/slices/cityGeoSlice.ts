import { createSlice } from '@reduxjs/toolkit'
import { feature } from 'topojson-client'
import type { FeatureCollection } from 'geojson'
import type { Topology } from 'topojson-specification'
import type { AppDispatch } from '../store'
import { readCityGeoCache, writeCityGeoCache } from '../utils/geo/cityGeoPersistence'

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

function getCityGeoFeatureCollection(topo: Topology): FeatureCollection {
  const geo = feature(topo, topo.objects.counties)

  if (geo.type !== 'FeatureCollection') {
    throw new Error('Fetched TopoJSON is not a FeatureCollection.')
  }

  return geo
}

export const fetchCityGeoJSON = () => async (dispatch: AppDispatch) => {
  const cachedCityGeo = await readCityGeoCache()

  if (cachedCityGeo) {
    dispatch(setGeoJSON(getCityGeoFeatureCollection(cachedCityGeo.topojson)))
  } else {
    dispatch(setLoading(true))
  }

  try {
    const url = 'https://cdn.jsdelivr.net/npm/taiwan-atlas/counties-10t.json'
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch city GeoJSON API.')
    const topo: Topology = await res.json()
    const geo = getCityGeoFeatureCollection(topo)

    dispatch(setGeoJSON(geo))
    await writeCityGeoCache({
      topojson: topo,
      updatedAt: new Date().toISOString()
    })
  } catch (err) {
    console.error('fetchCityGeoJSON error:', err)

    if (cachedCityGeo) {
      return
    }

    dispatch(setError('Failed to fetch city GeoJSON API.'))
  }
}

export default cityGeoSlice

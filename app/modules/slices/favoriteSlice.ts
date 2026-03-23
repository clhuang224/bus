import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { FavoriteRouteStop } from '../interfaces/FavoriteRouteStop'
import type { LocalizedText } from '../types/LocalizedText'

const FAVORITE_ROUTE_STOPS_STORAGE_KEY = 'favoriteRouteStops'

function toLocalizedText(value: unknown): LocalizedText | null {
  if (typeof value === 'string') {
    return {
      zh_TW: value,
      en: ''
    }
  }

  const localizedValue = value as Record<string, unknown> | null
  if (
    typeof value === 'object' &&
    value !== null &&
    'zh_TW' in value &&
    'en' in value &&
    typeof localizedValue?.zh_TW === 'string' &&
    typeof localizedValue.en === 'string'
  ) {
    return value as LocalizedText
  }

  return null
}

function normalizeStoredFavoriteRouteStop(item: unknown): FavoriteRouteStop | null {
  const favoriteRouteStop = item as Record<string, unknown> | null
  if (
    typeof item !== 'object' ||
    item === null ||
    !('favoriteId' in item) ||
    typeof favoriteRouteStop?.favoriteId !== 'string'
  ) {
    return null
  }

  const routeName = toLocalizedText(favoriteRouteStop.routeName)
  const subRouteName = toLocalizedText(favoriteRouteStop.subRouteName)
  const stopName = toLocalizedText(favoriteRouteStop.stopName)
  const departure = toLocalizedText(favoriteRouteStop.departure)
  const destination = toLocalizedText(favoriteRouteStop.destination)

  if (!routeName || !subRouteName || !stopName || !departure || !destination) {
    return null
  }

  return {
    ...(item as Omit<FavoriteRouteStop, 'routeName' | 'subRouteName' | 'stopName' | 'departure' | 'destination'>),
    routeName,
    subRouteName,
    stopName,
    departure,
    destination
  }
}

function loadStoredFavoriteRouteStops() {
  const storedValue = localStorage.getItem(FAVORITE_ROUTE_STOPS_STORAGE_KEY)
  if (!storedValue) return [] as FavoriteRouteStop[]

  const parsedValue = JSON.parse(storedValue) as unknown
  if (!Array.isArray(parsedValue)) return [] as FavoriteRouteStop[]

  return parsedValue.flatMap((item) => {
    const favoriteRouteStop = normalizeStoredFavoriteRouteStop(item)

    return favoriteRouteStop ? [favoriteRouteStop] : []
  })
}

function persistFavoriteRouteStops(routeStops: FavoriteRouteStop[]) {
  localStorage.setItem(FAVORITE_ROUTE_STOPS_STORAGE_KEY, JSON.stringify(routeStops))
}

const favoriteSlice = createSlice({
  name: 'favorite',
  initialState: {
    routeStops: [] as FavoriteRouteStop[]
  },
  reducers: {
    loadLocalStorage: (state) => {
      state.routeStops = loadStoredFavoriteRouteStops()
    },
    setFavoriteRouteStops: (state, action: PayloadAction<FavoriteRouteStop[]>) => {
      state.routeStops = action.payload
      persistFavoriteRouteStops(state.routeStops)
    },
    addFavoriteRouteStop: (state, action: PayloadAction<FavoriteRouteStop>) => {
      const newRouteStop = action.payload
      if (!state.routeStops.some((routeStop) => routeStop.favoriteId === newRouteStop.favoriteId)) {
        state.routeStops.push(newRouteStop)
        persistFavoriteRouteStops(state.routeStops)
      }
    },
    removeFavoriteRouteStop: (state, action: PayloadAction<FavoriteRouteStop>) => {
      const routeStopToRemove = action.payload
      state.routeStops = state.routeStops.filter((routeStop) => routeStop.favoriteId !== routeStopToRemove.favoriteId)
      persistFavoriteRouteStops(state.routeStops)
    }
  },
  selectors: {
    getFavoriteRouteStops: (state) => state.routeStops,
    isRouteStopFavorite: (state, favoriteId: string) =>
      state.routeStops.some((routeStop) => routeStop.favoriteId === favoriteId)
  }
})

export default favoriteSlice

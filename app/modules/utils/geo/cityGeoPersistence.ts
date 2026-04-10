import type { Topology } from 'topojson-specification'

const CITY_GEO_DB_NAME = 'bus-city-geo'
const CITY_GEO_DB_VERSION = 1
const CITY_GEO_STORE_NAME = 'city-geo-cache'
const CITY_GEO_CACHE_KEY = 'counties'

export interface CityGeoCacheRecord {
  topojson: Topology
  updatedAt: string
}

function openCityGeoDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(CITY_GEO_DB_NAME, CITY_GEO_DB_VERSION)

    request.onerror = () => {
      reject(request.error ?? new Error('Failed to open city geo IndexedDB.'))
    }

    request.onupgradeneeded = () => {
      const database = request.result

      if (!database.objectStoreNames.contains(CITY_GEO_STORE_NAME)) {
        database.createObjectStore(CITY_GEO_STORE_NAME)
      }
    }

    request.onsuccess = () => {
      resolve(request.result)
    }
  })
}

export async function readCityGeoCache() {
  const database = await openCityGeoDatabase()

  return new Promise<CityGeoCacheRecord | null>((resolve, reject) => {
    const transaction = database.transaction(CITY_GEO_STORE_NAME, 'readonly')
    const store = transaction.objectStore(CITY_GEO_STORE_NAME)
    const request = store.get(CITY_GEO_CACHE_KEY)

    request.onerror = () => {
      reject(request.error ?? new Error('Failed to read city geo cache from IndexedDB.'))
    }

    request.onsuccess = () => {
      resolve((request.result as CityGeoCacheRecord | undefined) ?? null)
    }

    transaction.oncomplete = () => {
      database.close()
    }

    transaction.onerror = () => {
      reject(transaction.error ?? new Error('Failed to complete city geo read transaction.'))
    }
  })
}

export async function writeCityGeoCache(record: CityGeoCacheRecord) {
  const database = await openCityGeoDatabase()

  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(CITY_GEO_STORE_NAME, 'readwrite')
    const store = transaction.objectStore(CITY_GEO_STORE_NAME)

    store.put(record, CITY_GEO_CACHE_KEY)

    transaction.oncomplete = () => {
      database.close()
      resolve()
    }

    transaction.onerror = () => {
      reject(transaction.error ?? new Error('Failed to write city geo cache to IndexedDB.'))
    }
  })
}

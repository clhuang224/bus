import type { Topology } from 'topojson-specification'

const CITY_BOUNDARY_DB_NAME = 'bus-city-geo'
const CITY_BOUNDARY_DB_VERSION = 1
const CITY_BOUNDARY_STORE_NAME = 'city-geo-cache'
const CITY_BOUNDARY_CACHE_KEY = 'counties'

export interface CityBoundaryCacheRecord {
  topojson: Topology
  updatedAt: string
}

function openCityBoundaryDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(CITY_BOUNDARY_DB_NAME, CITY_BOUNDARY_DB_VERSION)

    request.onerror = () => {
      reject(request.error ?? new Error('Failed to open city boundary IndexedDB.'))
    }

    request.onupgradeneeded = () => {
      const database = request.result

      if (!database.objectStoreNames.contains(CITY_BOUNDARY_STORE_NAME)) {
        database.createObjectStore(CITY_BOUNDARY_STORE_NAME)
      }
    }

    request.onsuccess = () => {
      resolve(request.result)
    }
  })
}

export async function readCityBoundaryCache() {
  const database = await openCityBoundaryDatabase()

  return new Promise<CityBoundaryCacheRecord | null>((resolve, reject) => {
    const transaction = database.transaction(CITY_BOUNDARY_STORE_NAME, 'readonly')
    const store = transaction.objectStore(CITY_BOUNDARY_STORE_NAME)
    const request = store.get(CITY_BOUNDARY_CACHE_KEY)

    request.onerror = () => {
      reject(request.error ?? new Error('Failed to read city boundary cache from IndexedDB.'))
    }

    request.onsuccess = () => {
      resolve((request.result as CityBoundaryCacheRecord | undefined) ?? null)
    }

    transaction.oncomplete = () => {
      database.close()
    }

    transaction.onerror = () => {
      reject(transaction.error ?? new Error('Failed to complete city boundary read transaction.'))
    }
  })
}

export async function writeCityBoundaryCache(record: CityBoundaryCacheRecord) {
  const database = await openCityBoundaryDatabase()

  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(CITY_BOUNDARY_STORE_NAME, 'readwrite')
    const store = transaction.objectStore(CITY_BOUNDARY_STORE_NAME)

    store.put(record, CITY_BOUNDARY_CACHE_KEY)

    transaction.oncomplete = () => {
      database.close()
      resolve()
    }

    transaction.onerror = () => {
      reject(transaction.error ?? new Error('Failed to write city boundary cache to IndexedDB.'))
    }
  })
}

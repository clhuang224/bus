import type { Topology } from 'topojson-specification'

const CITY_BOUNDARY_DB_NAME = 'bus-city-boundary'
const CITY_BOUNDARY_DB_VERSION = 1
const CITY_BOUNDARY_STORE_NAME = 'city-boundary-cache'
const CITY_BOUNDARY_CACHE_KEY = 'city-boundaries'

export interface CityBoundaryCacheRecord {
  topojson: Topology
  assetUrl?: string
  updatedAt: string
}

function openCityBoundaryDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const indexedDB = globalThis.indexedDB

    if (!indexedDB) {
      reject(new Error('IndexedDB is unavailable in this environment.'))
      return
    }

    const request = indexedDB.open(CITY_BOUNDARY_DB_NAME, CITY_BOUNDARY_DB_VERSION)

    request.onerror = () => {
      reject(request.error ?? new Error('Failed to open city boundary IndexedDB.'))
    }

    request.onblocked = () => {
      reject(new Error('City boundary IndexedDB open was blocked by another open connection.'))
    }

    request.onupgradeneeded = () => {
      const database = request.result

      if (!database.objectStoreNames.contains(CITY_BOUNDARY_STORE_NAME)) {
        database.createObjectStore(CITY_BOUNDARY_STORE_NAME)
      }
    }

    request.onsuccess = () => {
      const database = request.result
      database.onversionchange = () => {
        database.close()
      }
      resolve(database)
    }
  })
}

export async function readCityBoundaryCache() {
  const database = await openCityBoundaryDatabase()

  return new Promise<CityBoundaryCacheRecord | null>((resolve, reject) => {
    const transaction = database.transaction(CITY_BOUNDARY_STORE_NAME, 'readonly')
    const store = transaction.objectStore(CITY_BOUNDARY_STORE_NAME)
    const request = store.get(CITY_BOUNDARY_CACHE_KEY)
    let result: CityBoundaryCacheRecord | null = null

    const closeDatabase = () => {
      database.close()
    }

    request.onerror = () => {
      closeDatabase()
      reject(request.error ?? new Error('Failed to read city boundary cache from IndexedDB.'))
    }

    request.onsuccess = () => {
      result = (request.result as CityBoundaryCacheRecord | undefined) ?? null
    }

    transaction.oncomplete = () => {
      closeDatabase()
      resolve(result)
    }

    transaction.onerror = () => {
      closeDatabase()
      reject(transaction.error ?? new Error('Failed to complete city boundary read transaction.'))
    }

    transaction.onabort = () => {
      closeDatabase()
      reject(transaction.error ?? new Error('City boundary read transaction was aborted.'))
    }
  })
}

export async function writeCityBoundaryCache(record: CityBoundaryCacheRecord) {
  const database = await openCityBoundaryDatabase()

  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(CITY_BOUNDARY_STORE_NAME, 'readwrite')
    const store = transaction.objectStore(CITY_BOUNDARY_STORE_NAME)
    const closeDatabase = () => {
      database.close()
    }

    store.put(record, CITY_BOUNDARY_CACHE_KEY)

    transaction.oncomplete = () => {
      closeDatabase()
      resolve()
    }

    transaction.onerror = () => {
      closeDatabase()
      reject(transaction.error ?? new Error('Failed to write city boundary cache to IndexedDB.'))
    }

    transaction.onabort = () => {
      closeDatabase()
      reject(transaction.error ?? new Error('City boundary write transaction was aborted.'))
    }
  })
}

import type { allCityNames } from '../consts/geolocation'

export type CityNameType = typeof allCityNames[number]
export type CoordsType = [number, number] | null
export type GeolocationPermissionType = 'granted' | 'denied' | 'prompt' | 'unsupported'

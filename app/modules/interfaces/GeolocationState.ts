import type { CoordsType, GeolocationPermissionType } from '../types/geolocation'

export interface GeolocationState {
    coords: CoordsType
    permission: GeolocationPermissionType
    watching: boolean
}

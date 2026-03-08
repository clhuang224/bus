import type { GeoPermissionType } from '../enums/GeoPermissionType'
import type { LatLng } from '../types/CoordsType'

export interface GeolocationState {
    coords: LatLng | null
    permission: GeoPermissionType
    watching: boolean
}

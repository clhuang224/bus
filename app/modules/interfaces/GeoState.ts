import type { GeoPermissionType } from '../enums/geo/GeoPermissionType'
import type { GeoErrorType } from '../enums/geo/GeoErrorType'
import type { LatLng } from '../types/CoordsType'

export interface GeoState {
    coords: LatLng | null
    permission: GeoPermissionType
    watching: boolean
    error: GeoErrorType | null
}

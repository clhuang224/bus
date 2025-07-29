import type { GeoPermissionType } from '../enums/GeoPermissionType'
import type { CoordsType } from '../types/CoordsType'

export interface GeolocationState {
    coords: CoordsType
    permission: GeoPermissionType
    watching: boolean
}

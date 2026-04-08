import { DirectionType } from '../../enums/DirectionType'
import type { FavoriteRouteStop } from '../../interfaces/FavoriteRouteStop'
import type { LocalizedText } from '../../types/LocalizedText'
import { getEnumValues } from '../shared/getEnumValues'
import { isCityName } from '../shared/isCityName'

const directionValues = getEnumValues(DirectionType)

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isDirection(value: unknown): value is DirectionType {
  return isNumber(value) && directionValues.includes(value as DirectionType)
}

function toStoredLocalizedText(value: unknown): LocalizedText | null {
  if (typeof value === 'string') {
    return {
      'zh-TW': value,
      en: ''
    }
  }

  const localizedValue = value as Record<string, unknown> | null
  if (typeof value === 'object' && value !== null && typeof localizedValue?.en === 'string') {
    if (typeof localizedValue['zh-TW'] === 'string') {
      return {
        'zh-TW': localizedValue['zh-TW'],
        en: localizedValue.en
      }
    }

    if (typeof localizedValue.zh_TW === 'string') {
      return {
        'zh-TW': localizedValue.zh_TW,
        en: localizedValue.en
      }
    }
  }

  return null
}

export function normalizeStoredFavoriteRouteStop(item: unknown): FavoriteRouteStop | null {
  const favoriteRouteStop = item as Record<string, unknown> | null
  if (
    typeof item !== 'object' ||
    item === null ||
    !('favoriteId' in item) ||
    typeof favoriteRouteStop?.favoriteId !== 'string'
  ) {
    return null
  }

  const routeName = toStoredLocalizedText(favoriteRouteStop.routeName)
  const subRouteName = toStoredLocalizedText(favoriteRouteStop.subRouteName)
  const stopName = toStoredLocalizedText(favoriteRouteStop.stopName)
  const departure = toStoredLocalizedText(favoriteRouteStop.departure)
  const destination = toStoredLocalizedText(favoriteRouteStop.destination)

  if (!routeName || !subRouteName || !stopName || !departure || !destination) {
    return null
  }

  const {
    city,
    routeUID,
    subRouteUID,
    direction,
    stopUID,
    stopID,
    stationID,
    stationKey,
    stopSequence
  } = favoriteRouteStop

  if (
    !isCityName(city) ||
    !isString(routeUID) ||
    !isString(subRouteUID) ||
    !isDirection(direction) ||
    !isString(stopUID) ||
    !isString(stopID) ||
    !isNullableString(stationID) ||
    !isString(stationKey) ||
    !isNumber(stopSequence)
  ) {
    return null
  }

  return {
    favoriteId: favoriteRouteStop.favoriteId,
    city,
    routeUID,
    routeName,
    subRouteUID,
    subRouteName,
    direction,
    stopUID,
    stopID,
    stationID,
    stationKey,
    stopName,
    stopSequence,
    departure,
    destination
  }
}

import type {
  TdxBusOperator,
  TdxBusRoute,
  TdxBusSubRoute,
  TdxLocalizedText,
} from '@bus/shared'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNullableString(value: unknown): value is string | null | undefined {
  return value === undefined || value === null || typeof value === 'string'
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isNullableArray<T>(
  value: unknown,
  isItem: (item: unknown) => item is T,
): value is T[] | null | undefined {
  return (
    value === undefined ||
    value === null ||
    (Array.isArray(value) && value.every(isItem))
  )
}

function isTdxLocalizedText(value: unknown): value is TdxLocalizedText {
  return (
    isRecord(value) &&
    typeof value.Zh_tw === 'string' &&
    isNullableString(value.En) &&
    isNullableString(value.Ja) &&
    isNullableString(value.Ko)
  )
}

function isTdxBusOperator(value: unknown): value is TdxBusOperator {
  return (
    isRecord(value) &&
    isNonEmptyString(value.OperatorID) &&
    isTdxLocalizedText(value.OperatorName) &&
    isNullableString(value.OperatorCode) &&
    isNonEmptyString(value.OperatorNo)
  )
}

function isTdxBusSubRoute(value: unknown): value is TdxBusSubRoute {
  return (
    isRecord(value) &&
    isNonEmptyString(value.SubRouteUID) &&
    isNonEmptyString(value.SubRouteID) &&
    Array.isArray(value.OperatorIDs) &&
    value.OperatorIDs.every(isNonEmptyString) &&
    isTdxLocalizedText(value.SubRouteName) &&
    typeof value.Direction === 'number' &&
    Number.isFinite(value.Direction) &&
    isNullableString(value.Headsign) &&
    isNullableString(value.HeadsignEn) &&
    isNullableString(value.FirstBusTime) &&
    isNullableString(value.LastBusTime) &&
    isNullableString(value.HolidayFirstBusTime) &&
    isNullableString(value.HolidayLastBusTime) &&
    isNullableString(value.DepartureStopNameZh) &&
    isNullableString(value.DepartureStopNameEn) &&
    isNullableString(value.DestinationStopNameZh) &&
    isNullableString(value.DestinationStopNameEn)
  )
}

export function isTdxBusRoute(value: unknown): value is TdxBusRoute {
  if (!isRecord(value)) return false

  return (
    isNonEmptyString(value.RouteUID) &&
    isNonEmptyString(value.RouteID) &&
    typeof value.HasSubRoutes === 'boolean' &&
    Array.isArray(value.Operators) &&
    value.Operators.every(isTdxBusOperator) &&
    isNonEmptyString(value.AuthorityID) &&
    isNonEmptyString(value.ProviderID) &&
    isNullableArray(value.SubRoutes, isTdxBusSubRoute) &&
    typeof value.BusRouteType === 'number' &&
    Number.isFinite(value.BusRouteType) &&
    isTdxLocalizedText(value.RouteName) &&
    isNullableString(value.DepartureStopNameZh) &&
    isNullableString(value.DepartureStopNameEn) &&
    isNullableString(value.DestinationStopNameZh) &&
    isNullableString(value.DestinationStopNameEn) &&
    isNullableString(value.TicketPriceDescriptionZh) &&
    isNullableString(value.TicketPriceDescriptionEn) &&
    isNullableString(value.FareBufferZoneDescriptionZh) &&
    isNullableString(value.FareBufferZoneDescriptionEn) &&
    isNullableString(value.RouteMapImageUrl) &&
    isNullableString(value.City) &&
    isNullableString(value.CityCode) &&
    isNonEmptyString(value.UpdateTime) &&
    typeof value.VersionID === 'number' &&
    Number.isFinite(value.VersionID)
  )
}

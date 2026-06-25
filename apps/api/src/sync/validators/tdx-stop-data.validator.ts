import type {
  TdxLocalizedText,
  TdxStation,
  TdxStationGroup,
  TdxStop,
  TdxStopOfRoute,
  TdxStopPosition,
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

function isTdxLocalizedText(value: unknown): value is TdxLocalizedText {
  return (
    isRecord(value) &&
    typeof value.Zh_tw === 'string' &&
    isNullableString(value.En) &&
    isNullableString(value.Ja) &&
    isNullableString(value.Ko)
  )
}

function isTdxStopPosition(value: unknown): value is TdxStopPosition {
  return (
    isRecord(value) &&
    typeof value.PositionLon === 'number' &&
    Number.isFinite(value.PositionLon) &&
    typeof value.PositionLat === 'number' &&
    Number.isFinite(value.PositionLat) &&
    isNullableString(value.GeoHash)
  )
}

export function isTdxStationGroup(value: unknown): value is TdxStationGroup {
  return (
    isRecord(value) &&
    isNonEmptyString(value.StationGroupUID) &&
    isNonEmptyString(value.StationGroupID) &&
    isTdxLocalizedText(value.StationGroupName) &&
    isTdxStopPosition(value.StationGroupPosition) &&
    isNonEmptyString(value.UpdateTime) &&
    typeof value.VersionID === 'number' &&
    Number.isFinite(value.VersionID)
  )
}

export function isTdxStation(value: unknown): value is TdxStation {
  return (
    isRecord(value) &&
    isNonEmptyString(value.StationUID) &&
    isNonEmptyString(value.StationID) &&
    isNullableString(value.StationGroupUID) &&
    isTdxLocalizedText(value.StationName) &&
    isTdxStopPosition(value.StationPosition) &&
    isNullableString(value.StationAddress) &&
    isNullableString(value.Bearing) &&
    isNonEmptyString(value.UpdateTime) &&
    typeof value.VersionID === 'number' &&
    Number.isFinite(value.VersionID)
  )
}

export function isTdxStop(value: unknown): value is TdxStop {
  return (
    isRecord(value) &&
    isNonEmptyString(value.StopUID) &&
    isNonEmptyString(value.StopID) &&
    isNonEmptyString(value.AuthorityID) &&
    isNullableString(value.StationID) &&
    isNullableString(value.StationGroupID) &&
    isTdxLocalizedText(value.StopName) &&
    isTdxStopPosition(value.StopPosition) &&
    isNullableString(value.StopAddress) &&
    isNullableString(value.Bearing) &&
    isNullableString(value.StopDescription) &&
    isNonEmptyString(value.UpdateTime) &&
    typeof value.VersionID === 'number' &&
    Number.isFinite(value.VersionID)
  )
}

export function isTdxStopOfRoute(value: unknown): value is TdxStopOfRoute {
  if (!isRecord(value)) return false

  return (
    isNonEmptyString(value.RouteUID) &&
    isNonEmptyString(value.RouteID) &&
    isTdxLocalizedText(value.RouteName) &&
    isNonEmptyString(value.SubRouteUID) &&
    isNonEmptyString(value.SubRouteID) &&
    isTdxLocalizedText(value.SubRouteName) &&
    typeof value.Direction === 'number' &&
    Number.isFinite(value.Direction) &&
    Array.isArray(value.Stops) &&
    value.Stops.every(isTdxStopOfRouteStop)
  )
}

function isTdxStopOfRouteStop(
  value: unknown,
): value is TdxStopOfRoute['Stops'][number] {
  return (
    isRecord(value) &&
    isNonEmptyString(value.StopUID) &&
    isNonEmptyString(value.StopID) &&
    isTdxLocalizedText(value.StopName) &&
    typeof value.StopSequence === 'number' &&
    Number.isFinite(value.StopSequence) &&
    isNullableString(value.StationID)
  )
}

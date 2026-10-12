import {
  TdxA2EventType,
  type TdxEstimatedArrival,
  type TdxLocalizedText,
  type TdxRealtimeByFrequency,
  type TdxRealtimeNearStop,
} from '@bus/shared'

// Realtime records are checked one by one so that a single malformed record
// is skipped instead of failing the whole response.

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isOptionalString(value: unknown): value is string | null | undefined {
  return value === undefined || value === null || typeof value === 'string'
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isOptionalNumber(value: unknown): value is number | null | undefined {
  return value === undefined || value === null || isFiniteNumber(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/** TDX only defines departed (0) and arriving (1); other values are malformed. */
function isOptionalA2EventType(
  value: unknown,
): value is TdxA2EventType | null | undefined {
  return (
    value === undefined ||
    value === null ||
    value === TdxA2EventType.DEPARTED ||
    value === TdxA2EventType.ARRIVING
  )
}

function isOptionalLocalizedText(
  value: unknown,
): value is TdxLocalizedText | null | undefined {
  return (
    value === undefined ||
    value === null ||
    (isRecord(value) &&
      typeof value.Zh_tw === 'string' &&
      isOptionalString(value.En))
  )
}

export function isTdxEstimatedArrival(
  value: unknown,
): value is TdxEstimatedArrival {
  return (
    isRecord(value) &&
    isOptionalString(value.PlateNumb) &&
    isOptionalString(value.StopUID) &&
    isOptionalString(value.StopID) &&
    isOptionalString(value.RouteUID) &&
    isOptionalString(value.SubRouteUID) &&
    isFiniteNumber(value.Direction) &&
    isOptionalNumber(value.StopSequence) &&
    isOptionalNumber(value.EstimateTime) &&
    isOptionalNumber(value.StopStatus)
  )
}

export function isTdxRealtimeNearStop(
  value: unknown,
): value is TdxRealtimeNearStop {
  return (
    isRecord(value) &&
    isNonEmptyString(value.PlateNumb) &&
    isOptionalString(value.SubRouteUID) &&
    isFiniteNumber(value.Direction) &&
    isOptionalString(value.StopUID) &&
    isOptionalString(value.StopID) &&
    isOptionalLocalizedText(value.StopName) &&
    isFiniteNumber(value.StopSequence) &&
    isOptionalA2EventType(value.A2EventType)
  )
}

export function isTdxRealtimeByFrequency(
  value: unknown,
): value is TdxRealtimeByFrequency {
  return (
    isRecord(value) &&
    isNonEmptyString(value.PlateNumb) &&
    isOptionalString(value.SubRouteUID) &&
    isOptionalNumber(value.Direction) &&
    (value.BusPosition === undefined ||
      value.BusPosition === null ||
      (isRecord(value.BusPosition) &&
        isOptionalNumber(value.BusPosition.PositionLon) &&
        isOptionalNumber(value.BusPosition.PositionLat)))
  )
}

import type {
  BearingType,
  CityNameType,
  TdxStation,
  TdxStationGroup,
  TdxStop,
  TdxStopOfRoute,
} from '@bus/shared'
import { PRISMA_BEARING_BY_TDX_BEARING } from '../../constants/enum-mappings.js'
import {
  BearingType as PrismaBearingType,
  CityNameType as PrismaCityNameType,
  RouteShapeSource as PrismaRouteShapeSource,
} from '../../generated/prisma/enums.js'
import { cityMapper } from './route.mapper.js'

interface LocalizedNameRecord {
  name_zh_tw: string
  name_en: string | null
  name_ja: string | null
  name_ko: string | null
}

interface StationGroupRecord {
  uuid: string
  tdx_station_group_id: string
  city: PrismaCityNameType
  name_zh_tw: string
  name_en: string | null
  name_ja: string | null
  name_ko: string | null
  latitude: number
  longitude: number
  tdx_updated_at: Date | null
}

interface StationRecord {
  uuid: string
  tdx_station_id: string
  station_group_uuid: string | null
  city: PrismaCityNameType
  name_zh_tw: string
  name_en: string | null
  name_ja: string | null
  name_ko: string | null
  address_zh_tw: string | null
  latitude: number
  longitude: number
  bearing: PrismaBearingType | null
  tdx_updated_at: Date | null
}

interface StopRecord {
  uuid: string
  tdx_stop_id: string
  station_tdx_id: string | null
  city: PrismaCityNameType
  name_zh_tw: string
  name_en: string | null
  name_ja: string | null
  name_ko: string | null
  address_zh_tw: string | null
  latitude: number
  longitude: number
  bearing: PrismaBearingType | null
  tdx_updated_at: Date | null
}

export interface RouteStopRecord {
  subroute_uuid: string
  stop_uuid: string
  sequence: number
  tdx_updated_at: Date | null
}

export interface RouteShapeRecord {
  subroute_uuid: string
  source: PrismaRouteShapeSource
  path: [number, number][]
  tdx_updated_at: Date | null
}

export interface StopSyncRecords {
  stationGroups: StationGroupRecord[]
  stations: StationRecord[]
  stops: StopRecord[]
  routeStops: RouteStopRecord[]
  routeShapes: RouteShapeRecord[]
}

function mapLocalizedName(text: {
  Zh_tw: string
  En?: string | null
  Ja?: string | null
  Ko?: string | null
}): LocalizedNameRecord {
  return {
    name_zh_tw: toRequiredText(text.Zh_tw),
    name_en: toNullableText(text.En),
    name_ja: toNullableText(text.Ja),
    name_ko: toNullableText(text.Ko),
  }
}

function mapBearing(
  bearing: BearingType | null | undefined,
): PrismaBearingType | null {
  if (!bearing) return null

  return PRISMA_BEARING_BY_TDX_BEARING[bearing] ?? null
}

function toRequiredText(value: string | null | undefined): string {
  return value?.trim() ?? ''
}

function toNullableText(value: string | null | undefined): string | null {
  const text = value?.trim()

  return text ? text : null
}

function toDate(value: string): Date | null {
  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

function mapSubRouteUuid(subRouteUid: string, direction: number): string {
  return `${subRouteUid}-${direction}`
}

export function stopMapper({
  city,
  stationGroups,
  stations,
  stops,
  stopOfRoutes,
}: {
  city: CityNameType
  stationGroups: TdxStationGroup[]
  stations: TdxStation[]
  stops: TdxStop[]
  stopOfRoutes: TdxStopOfRoute[]
}): StopSyncRecords {
  const prismaCity = cityMapper(city)
  const mappedStops = mapStops(prismaCity, stops)

  return {
    stationGroups: mapStationGroups(prismaCity, stationGroups),
    stations: mapStations(prismaCity, stations),
    stops: mappedStops,
    routeStops: mapRouteStops(stopOfRoutes),
    routeShapes: mapRouteShapes(stopOfRoutes, mappedStops),
  }
}

function mapStationGroups(
  city: PrismaCityNameType,
  stationGroups: TdxStationGroup[],
): StationGroupRecord[] {
  return stationGroups.map((stationGroup) => ({
    uuid: stationGroup.StationGroupUID,
    tdx_station_group_id: stationGroup.StationGroupID,
    city,
    ...mapLocalizedName(stationGroup.StationGroupName),
    latitude: stationGroup.StationGroupPosition.PositionLat,
    longitude: stationGroup.StationGroupPosition.PositionLon,
    tdx_updated_at: toDate(stationGroup.UpdateTime),
  }))
}

function mapStations(
  city: PrismaCityNameType,
  stations: TdxStation[],
): StationRecord[] {
  return stations.map((station) => ({
    uuid: station.StationUID,
    tdx_station_id: station.StationID,
    station_group_uuid: toNullableText(station.StationGroupUID),
    city,
    ...mapLocalizedName(station.StationName),
    address_zh_tw: toNullableText(station.StationAddress),
    latitude: station.StationPosition.PositionLat,
    longitude: station.StationPosition.PositionLon,
    bearing: mapBearing(station.Bearing),
    tdx_updated_at: toDate(station.UpdateTime),
  }))
}

function mapStops(city: PrismaCityNameType, stops: TdxStop[]): StopRecord[] {
  return stops.flatMap((stop) => {
    const latitude = stop.StopPosition.PositionLat
    const longitude = stop.StopPosition.PositionLon

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return []
    }

    return [
      {
        uuid: stop.StopUID,
        tdx_stop_id: stop.StopID,
        station_tdx_id: toNullableText(stop.StationID),
        city,
        ...mapLocalizedName(stop.StopName),
        address_zh_tw: toNullableText(stop.StopAddress),
        latitude,
        longitude,
        bearing: mapBearing(stop.Bearing),
        tdx_updated_at: toDate(stop.UpdateTime),
      },
    ]
  })
}

function mapRouteStops(stopOfRoutes: TdxStopOfRoute[]): RouteStopRecord[] {
  const routeStops: RouteStopRecord[] = []

  for (const stopOfRoute of stopOfRoutes) {
    const subrouteUuid = mapSubRouteUuid(
      stopOfRoute.SubRouteUID,
      stopOfRoute.Direction,
    )
    const updatedAt = null

    for (const stop of stopOfRoute.Stops) {
      routeStops.push({
        subroute_uuid: subrouteUuid,
        stop_uuid: stop.StopUID,
        sequence: stop.StopSequence,
        tdx_updated_at: updatedAt,
      })
    }
  }

  return routeStops
}

function mapRouteShapes(
  stopOfRoutes: TdxStopOfRoute[],
  stops: StopRecord[],
): RouteShapeRecord[] {
  const stopCoordinates = new Map(
    stops.map((stop) => [stop.uuid, [stop.longitude, stop.latitude] as const]),
  )
  const routeShapes: RouteShapeRecord[] = []

  for (const stopOfRoute of stopOfRoutes) {
    const path: [number, number][] = []

    for (const stop of stopOfRoute.Stops) {
      const coordinates = stopCoordinates.get(stop.StopUID)

      if (coordinates) {
        path.push([coordinates[0], coordinates[1]])
      }
    }

    if (path.length < 2) continue

    routeShapes.push({
      subroute_uuid: mapSubRouteUuid(
        stopOfRoute.SubRouteUID,
        stopOfRoute.Direction,
      ),
      source: PrismaRouteShapeSource.STOP_POSITIONS,
      path,
      tdx_updated_at: null,
    })
  }

  return routeShapes
}

import type { RouteStopFindManyArgs } from '../generated/prisma/models/RouteStop.js'
import type { StationSelect } from '../generated/prisma/models/Station.js'
import type { StopSelect } from '../generated/prisma/models/Stop.js'

const locationSelect = {
  uuid: true,
  city: true,
  name_zh_tw: true,
  name_en: true,
  address_zh_tw: true,
  address_en: true,
  latitude: true,
  longitude: true,
  bearing: true,
} satisfies StationSelect

const routeStopsQuery = {
  where: {
    is_active: true,
    subroute: {
      is_active: true,
      route: { is_active: true },
    },
  },
  select: {
    subroute: {
      select: {
        direction: true,
        route: {
          select: {
            uuid: true,
            city: true,
            name_zh_tw: true,
            name_en: true,
            departure_zh_tw: true,
            departure_en: true,
            destination_zh_tw: true,
            destination_en: true,
          },
        },
      },
    },
  },
} satisfies RouteStopFindManyArgs

export const stationSelect = {
  ...locationSelect,
  stops: {
    where: { is_active: true },
    orderBy: { uuid: 'asc' },
    select: {
      address_zh_tw: true,
      address_en: true,
      route_stops: routeStopsQuery,
    },
  },
} satisfies StationSelect

export const standaloneStopSelect = {
  ...locationSelect,
  route_stops: routeStopsQuery,
} satisfies StopSelect

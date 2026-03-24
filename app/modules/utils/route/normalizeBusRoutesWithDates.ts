import type { BusRoute, BusSubRoute } from '../../interfaces/BusRoute'

function toDateOrNull(value: string): Date | null {
  if (!value) return null

  const timeOnlyMatch = value.match(/^(\d{2}):(\d{2})$/)
  if (timeOnlyMatch) {
    const [, hours, minutes] = timeOnlyMatch
    return new Date(1970, 0, 1, Number(hours), Number(minutes))
  }

  const parsedDate = new Date(value)
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
}

function normalizeBusSubRouteWithDates(busSubRoute: BusSubRoute<string>): BusSubRoute<Date | null> {
  return {
    ...busSubRoute,
    FirstBusTime: toDateOrNull(busSubRoute.FirstBusTime),
    LastBusTime: toDateOrNull(busSubRoute.LastBusTime),
    HolidayFirstBusTime: toDateOrNull(busSubRoute.HolidayFirstBusTime),
    HolidayLastBusTime: toDateOrNull(busSubRoute.HolidayLastBusTime)
  }
}

export function normalizeBusRoutesWithDates(routes: BusRoute<string>[]): BusRoute<Date | null>[] {
  return routes.map((route) => ({
    ...route,
    SubRoutes: route.SubRoutes.map(normalizeBusSubRouteWithDates),
    UpdateTime: toDateOrNull(route.UpdateTime)
  }))
}

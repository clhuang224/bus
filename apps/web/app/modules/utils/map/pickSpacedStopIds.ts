interface ScreenStop {
  id: string
  x: number
  y: number
}

function isFarEnough(
  stop: ScreenStop,
  keptStops: ScreenStop[],
  minDistancePx: number,
) {
  return keptStops.every(
    (keptStop) =>
      Math.hypot(stop.x - keptStop.x, stop.y - keptStop.y) >= minDistancePx,
  )
}

export function pickSpacedStopIds(
  stopsInRouteOrder: ScreenStop[],
  pinnedStopIds: Set<string>,
  minDistancePx: number,
) {
  const keptStops = stopsInRouteOrder.filter((stop) =>
    pinnedStopIds.has(stop.id),
  )

  for (const stop of stopsInRouteOrder) {
    if (pinnedStopIds.has(stop.id)) continue
    if (isFarEnough(stop, keptStops, minDistancePx)) {
      keptStops.push(stop)
    }
  }

  return new Set(keptStops.map((stop) => stop.id))
}

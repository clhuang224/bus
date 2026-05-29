const LATITUDE_KILOMETERS_PER_DEGREE = 111.32

export function getLatitudeKilometersPerDegree(): number {
  return LATITUDE_KILOMETERS_PER_DEGREE
}

export function getLongitudeKilometersPerDegree(latitude: number): number {
  const latitudeRadians = latitude * Math.PI / 180
  return LATITUDE_KILOMETERS_PER_DEGREE * Math.cos(latitudeRadians)
}

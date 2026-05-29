import { describe, expect, it } from 'vitest'
import { parseRouteShapePath } from './parseRouteShapePath'

describe('parseRouteShapePath', () => {
  it('parses coordinates from WKT geometry', () => {
    expect(parseRouteShapePath({
      geometry: 'LINESTRING (121.56 25.04, 121.57 25.05)'
    })).toEqual([
      [121.56, 25.04],
      [121.57, 25.05]
    ])
  })

  it('prefers encoded polyline when present', () => {
    expect(parseRouteShapePath({
      encodedPolyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
      geometry: 'LINESTRING (0 0, 1 1)'
    })).toEqual([
      [-120.2, 38.5],
      [-120.95, 40.7],
      [-126.453, 43.252]
    ])
  })
})

import { describe, expect, it } from 'vitest'
import { getGoogleMapsDirectionsUrl } from './getGoogleMapsDirectionsUrl'

describe('getGoogleMapsDirectionsUrl', () => {
  it('builds a destination-only directions URL', () => {
    expect(
      getGoogleMapsDirectionsUrl({
        destination: [25.033, 121.5654]
      })
    ).toBe('https://www.google.com/maps/dir/?api=1&destination=25.033%2C121.5654')
  })

  it('includes the origin when user coordinates are available', () => {
    expect(
      getGoogleMapsDirectionsUrl({
        origin: [25.0478, 121.5319],
        destination: [25.033, 121.5654]
      })
    ).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=25.033%2C121.5654&origin=25.0478%2C121.5319'
    )
  })
})

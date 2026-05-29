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
})

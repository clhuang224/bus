import { describe, expect, it } from 'vitest'
import { pickSpacedStopIds } from './pickSpacedStopIds'

const MIN_DISTANCE_PX = 28

describe('pickSpacedStopIds', () => {
  it('keeps every stop when none of them overlap', () => {
    const stops = [
      { id: 'a', x: 0, y: 0 },
      { id: 'b', x: 40, y: 0 },
      { id: 'c', x: 80, y: 0 },
    ]

    expect(pickSpacedStopIds(stops, new Set(), MIN_DISTANCE_PX)).toEqual(
      new Set(['a', 'b', 'c']),
    )
  })

  it('drops stops that would overlap a stop earlier on the route', () => {
    const stops = [
      { id: 'a', x: 0, y: 0 },
      { id: 'b', x: 10, y: 0 },
      { id: 'c', x: 20, y: 0 },
      { id: 'd', x: 30, y: 0 },
    ]

    expect(pickSpacedStopIds(stops, new Set(), MIN_DISTANCE_PX)).toEqual(
      new Set(['a', 'd']),
    )
  })

  it('always keeps pinned stops and spaces the others around them', () => {
    const stops = [
      { id: 'first', x: 0, y: 0 },
      { id: 'near-first', x: 10, y: 0 },
      { id: 'selected', x: 20, y: 0 },
      { id: 'middle', x: 60, y: 0 },
      { id: 'last', x: 70, y: 0 },
    ]

    expect(
      pickSpacedStopIds(
        stops,
        new Set(['first', 'selected', 'last']),
        MIN_DISTANCE_PX,
      ),
    ).toEqual(new Set(['first', 'selected', 'last']))
  })
})

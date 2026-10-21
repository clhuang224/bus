import { describe, expect, it } from 'vitest'
import { AppLocaleType, RealtimeArrivalStatus } from '@bus/shared'
import i18n from '~/modules/i18n'
import { formatRealtimeArrival } from './formatRealtimeArrival'

const t = i18n.getFixedT(AppLocaleType.EN)

describe('formatRealtimeArrival', () => {
  it('shows the countdown in minutes', () => {
    expect(
      formatRealtimeArrival(t, {
        status: RealtimeArrivalStatus.MINUTES,
        minutes: 4,
      }),
    ).toBe('Arriving in 4 mins')
  })

  it.each([
    [RealtimeArrivalStatus.COMING_SOON, 'Coming soon'],
    [RealtimeArrivalStatus.NO_ESTIMATE, 'No estimate available'],
    [RealtimeArrivalStatus.NOT_YET_DEPARTED, 'Not departed yet'],
    [
      RealtimeArrivalStatus.NO_STOP_DUE_TO_TRAFFIC_CONTROL,
      'Skipping stop due to traffic control',
    ],
    [RealtimeArrivalStatus.LAST_BUS_PASSED, 'Last bus has passed'],
    [RealtimeArrivalStatus.NOT_IN_SERVICE_TODAY, 'Not in service today'],
    [RealtimeArrivalStatus.IN_SERVICE, 'In service'],
    [RealtimeArrivalStatus.UNKNOWN, 'Unknown status'],
  ])('labels %s', (status, label) => {
    expect(formatRealtimeArrival(t, { status, minutes: null })).toBe(label)
  })
})

import { ApiProperty } from '@nestjs/swagger'
import {
  RealtimeArrivalStatus,
  RealtimeVehicleState,
  RouteRealtimeStatus,
  type ApiRealtimeArrival,
  type ApiRouteRealtime,
  type ApiRouteRealtimeNearStop,
  type ApiRouteRealtimeStop,
  type ApiRouteRealtimeSubRoute,
  type ApiRouteRealtimeVehicle,
} from '@bus/shared'
import { LocalizedTextDto, PositionDto } from '../../dto/shared.dto.js'

export class RealtimeArrivalDto implements ApiRealtimeArrival {
  @ApiProperty({
    description:
      'How to present the arrival. `minutes` comes with a minute count; `in_service` is only used for vehicles without a usable estimate.',
    enum: RealtimeArrivalStatus,
    example: RealtimeArrivalStatus.MINUTES,
  })
  status!: RealtimeArrivalStatus

  @ApiProperty({
    description: 'Minutes until arrival, only when status is `minutes`',
    nullable: true,
    example: 4,
  })
  minutes!: number | null
}

export class RouteRealtimeStopDto implements ApiRouteRealtimeStop {
  @ApiProperty({
    description: 'Stop UUID from the route detail response',
    example: 'TPE43100',
  })
  uuid!: string

  @ApiProperty({
    description: 'Arrival for this stop, or null when no ETA covers it',
    type: RealtimeArrivalDto,
    nullable: true,
  })
  arrival!: RealtimeArrivalDto | null
}

export class RouteRealtimeNearStopDto implements ApiRouteRealtimeNearStop {
  @ApiProperty({
    description: 'Stop UUID, or null when the realtime feed omits it',
    nullable: true,
    example: 'TPE43100',
  })
  uuid!: string | null

  @ApiProperty({ description: 'Stop sequence in the sub-route', example: 7 })
  sequence!: number

  @ApiProperty({
    description: 'Localized stop name from the realtime feed',
    type: LocalizedTextDto,
    example: { 'zh-TW': '捷運公館站', en: 'MRT Gongguan Sta.' },
  })
  name!: LocalizedTextDto
}

export class RouteRealtimeVehicleDto implements ApiRouteRealtimeVehicle {
  @ApiProperty({ description: 'Vehicle plate number', example: 'EAL-1092' })
  plate_number!: string

  @ApiProperty({
    description:
      'Stop the vehicle is near, or null for vehicles only in the GPS feed',
    type: RouteRealtimeNearStopDto,
    nullable: true,
  })
  near_stop!: RouteRealtimeNearStopDto | null

  @ApiProperty({
    description:
      'Vehicle state at its nearest stop, or null for vehicles only in the GPS feed',
    enum: RealtimeVehicleState,
    nullable: true,
    example: RealtimeVehicleState.DEPARTED,
  })
  state!: RealtimeVehicleState | null

  @ApiProperty({
    description:
      'Arrival that describes this vehicle. A departed vehicle uses the next stop; otherwise the current stop.',
    type: RealtimeArrivalDto,
  })
  arrival!: RealtimeArrivalDto

  @ApiProperty({
    description: 'GPS position, or null when unavailable',
    type: PositionDto,
    nullable: true,
  })
  position!: PositionDto | null
}

export class RouteRealtimeSubRouteDto implements ApiRouteRealtimeSubRoute {
  @ApiProperty({
    description: 'Sub-route UUID from the route detail response',
    example: 'TPE118110-1',
  })
  uuid!: string

  @ApiProperty({
    description:
      'Message to show for this sub-route, in priority order: `rate_limited`, `unavailable`, then the service state. Only the ETA and near-stop feeds affect it; GPS failures only leave vehicle positions null.',
    enum: RouteRealtimeStatus,
    example: RouteRealtimeStatus.NORMAL,
  })
  status!: RouteRealtimeStatus

  @ApiProperty({
    description: 'Every stop of the sub-route, in sequence order',
    type: [RouteRealtimeStopDto],
  })
  stops!: RouteRealtimeStopDto[]

  @ApiProperty({
    description:
      'Vehicles near a stop first, ordered by arrival; vehicles only in the GPS feed last',
    type: [RouteRealtimeVehicleDto],
  })
  vehicles!: RouteRealtimeVehicleDto[]
}

export class RouteRealtimeResponseDto implements ApiRouteRealtime {
  @ApiProperty({ description: 'Route UUID', example: 'TPE11811' })
  uuid!: string

  @ApiProperty({
    description: 'Realtime data for every sub-route of the route',
    type: [RouteRealtimeSubRouteDto],
  })
  sub_routes!: RouteRealtimeSubRouteDto[]

  @ApiProperty({
    description: 'When the API fetched this snapshot from TDX',
    example: '2026-10-11T08:30:00.000Z',
  })
  updated_at!: string
}

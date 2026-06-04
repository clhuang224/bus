import { ApiProperty } from '@nestjs/swagger'
import { DirectionType } from '@bus/shared'
import { LocalizedTextDto, PositionDto } from '../../dto/shared.dto.js'

export class RouteRealtimeStopRefDto {
  @ApiProperty({ description: 'Stop UUID', example: 'stop-1' })
  uuid!: string

  @ApiProperty({
    description: 'Stop sequence in the route direction',
    example: 1,
    nullable: true,
  })
  sequence!: number | null

  @ApiProperty({
    description: 'Localized stop name',
    type: LocalizedTextDto,
    nullable: true,
  })
  name!: LocalizedTextDto | null
}

export class RouteRealtimeArrivalDto {
  @ApiProperty({
    description: 'Stop receiving this ETA',
    type: RouteRealtimeStopRefDto,
  })
  stop!: RouteRealtimeStopRefDto

  @ApiProperty({
    description: 'Estimated arrival time in seconds',
    example: 300,
    nullable: true,
  })
  estimate_seconds!: number | null

  @ApiProperty({
    description: 'Fallback next bus timestamp when no countdown is available',
    example: null,
    nullable: true,
  })
  next_bus_time!: string | null

  @ApiProperty({
    description: 'Stop status code normalized by the backend',
    example: 'normal',
  })
  status!: string

  @ApiProperty({ description: 'Realtime source update timestamp', example: '' })
  updated_at!: string
}

export class RouteRealtimeVehicleDto {
  @ApiProperty({ description: 'Vehicle plate number', example: 'ABC-123' })
  plate_number!: string

  @ApiProperty({
    description: 'Route direction',
    enum: DirectionType,
    nullable: true,
  })
  direction!: DirectionType | null

  @ApiProperty({
    description: 'Vehicle position',
    type: PositionDto,
    nullable: true,
  })
  position!: PositionDto | null

  @ApiProperty({
    description: 'Stop the vehicle is currently near',
    type: RouteRealtimeStopRefDto,
    nullable: true,
  })
  near_stop!: RouteRealtimeStopRefDto | null

  @ApiProperty({
    description: 'Realtime vehicle state normalized by the backend',
    example: 'in_service',
  })
  state!: string

  @ApiProperty({ description: 'Realtime source update timestamp', example: '' })
  updated_at!: string
}

export class RouteRealtimeResponseDto {
  @ApiProperty({ description: 'Route UUID', example: 'route-1' })
  uuid!: string

  @ApiProperty({
    description: 'Stop-based ETA data for polling',
    type: [RouteRealtimeArrivalDto],
  })
  arrivals!: RouteRealtimeArrivalDto[]

  @ApiProperty({
    description: 'Realtime vehicle snapshots for polling',
    type: [RouteRealtimeVehicleDto],
  })
  vehicles!: RouteRealtimeVehicleDto[]

  @ApiProperty({
    description: 'Response generation timestamp',
    example: '',
  })
  updated_at!: string
}

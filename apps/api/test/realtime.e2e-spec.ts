import { type INestApplication } from '@nestjs/common'
import request from 'supertest'
import {
  DirectionType,
  ErrorCode,
  RealtimeArrivalStatus,
  RealtimeVehicleState,
  RouteRealtimeStatus,
  TdxA2EventType,
  TdxStopStatus,
  type ApiErrorResponse,
  type ApiSuccessResponse,
} from '@bus/shared'
import {
  CityNameType as PrismaCityNameType,
  DirectionType as PrismaDirectionType,
} from '../src/generated/prisma/enums.js'
import { PrismaService } from '../src/prisma/prisma.service.js'
import type { RouteRealtimeResponseDto } from '../src/realtime/dto/route-realtime-response.dto.js'
import { TdxRealtimeClientService } from '../src/realtime/tdx-realtime-client.service.js'
import { createE2eApp } from './create-e2e-app.js'

describe('Realtime API (e2e)', () => {
  let app: INestApplication

  beforeEach(async () => {
    app = await createE2eApp({
      configureModule: (builder) =>
        builder
          .overrideProvider(PrismaService)
          .useValue({
            $disconnect: () => Promise.resolve(),
            route: {
              findFirst: ({ where }: { where: { uuid: string } }) =>
                Promise.resolve(
                  where.uuid === 'TPE11811'
                    ? {
                        uuid: 'TPE11811',
                        city: PrismaCityNameType.TAIPEI,
                        subroutes: [
                          {
                            uuid: 'TPE118110-1',
                            tdx_subroute_uid: 'TPE118110',
                            direction: PrismaDirectionType.RETURN,
                            route_stops: [
                              { stop: { uuid: 'TPE7', tdx_stop_id: '7' } },
                              { stop: { uuid: 'TPE8', tdx_stop_id: '8' } },
                            ],
                          },
                        ],
                      }
                    : null,
                ),
            },
          })
          .overrideProvider(TdxRealtimeClientService)
          .useValue({
            fetchEstimatedArrivals: () =>
              Promise.resolve({
                ok: true,
                data: [8].map((sequence) => ({
                  RouteUID: 'TPE11811',
                  SubRouteUID: 'TPE118110',
                  Direction: DirectionType.RETURN,
                  StopUID: `TPE${sequence}`,
                  StopSequence: sequence,
                  EstimateTime: 240,
                  StopStatus: TdxStopStatus.NORMAL,
                })),
              }),
            fetchNearStops: () =>
              Promise.resolve({
                ok: true,
                data: [
                  {
                    PlateNumb: 'EAL-1092',
                    SubRouteUID: 'TPE118110',
                    Direction: DirectionType.RETURN,
                    StopUID: 'TPE7',
                    StopName: { Zh_tw: '捷運公館站', En: 'MRT Gongguan Sta.' },
                    StopSequence: 7,
                    A2EventType: TdxA2EventType.DEPARTED,
                  },
                ],
              }),
            fetchPositions: () => Promise.resolve({ ok: true, data: [] }),
          }),
    })
  })

  afterEach(async () => {
    await app.close()
  })

  it('/api/realtime/routes/:uuid (GET) returns per-stop and per-vehicle results', () => {
    return request(app.getHttpServer())
      .get('/api/realtime/routes/TPE11811')
      .expect(200)
      .expect(
        ({ body }: { body: ApiSuccessResponse<RouteRealtimeResponseDto> }) => {
          expect(body.data.uuid).toBe('TPE11811')
          expect(typeof body.data.updated_at).toBe('string')
          expect(body.data.sub_routes).toEqual([
            {
              uuid: 'TPE118110-1',
              status: RouteRealtimeStatus.NORMAL,
              stops: [
                { uuid: 'TPE7', arrival: null },
                {
                  uuid: 'TPE8',
                  arrival: {
                    status: RealtimeArrivalStatus.MINUTES,
                    minutes: 4,
                  },
                },
              ],
              vehicles: [
                {
                  plate_number: 'EAL-1092',
                  near_stop: {
                    uuid: 'TPE7',
                    sequence: 7,
                    name: { 'zh-TW': '捷運公館站', en: 'MRT Gongguan Sta.' },
                  },
                  state: RealtimeVehicleState.DEPARTED,
                  arrival: {
                    status: RealtimeArrivalStatus.MINUTES,
                    minutes: 4,
                  },
                  position: null,
                },
              ],
            },
          ])
        },
      )
  })

  it('/api/realtime/routes/:uuid (GET) returns 404 for a missing route', () => {
    return request(app.getHttpServer())
      .get('/api/realtime/routes/missing')
      .expect(404)
      .expect(({ body }: { body: ApiErrorResponse }) => {
        expect(body.error.code).toBe(ErrorCode.ROUTE_NOT_FOUND)
      })
  })
})

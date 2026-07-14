import { type INestApplication } from '@nestjs/common'
import request from 'supertest'
import {
  AreaType,
  CityNameType,
  DirectionType,
  ErrorCode,
  type ApiErrorResponse,
  type ApiSuccessResponse,
} from '@bus/shared'
import {
  CityNameType as PrismaCityNameType,
  DirectionType as PrismaDirectionType,
} from '../src/generated/prisma/enums.js'
import type {
  RouteDetailResponseDto,
  RoutesResponseDto,
} from '../src/routes/dto/routes-response.dto.js'
import type { RouteFindFirstArgs } from '../src/generated/prisma/models/Route.js'
import { PrismaService } from '../src/prisma/prisma.service.js'
import { createE2eApp } from './create-e2e-app.js'

describe('Routes API (e2e)', () => {
  let app: INestApplication
  let routeFindManyArgs: unknown[]
  let routeFindFirstArgs: RouteFindFirstArgs[]

  const routeShapePathFor = (uuid?: string) => {
    switch (uuid) {
      case 'route-with-malformed-shape':
        return ['broken-shape-path']
      case 'route-with-partial-shape':
        return [[121, 25], 'broken-shape-point', [122, 26]]
      case 'route-with-extra-shape-point':
        return [[121, 25, 999]]
      case 'route-with-non-finite-shape-point':
        return [[121, Number.NaN]]
      default:
        return [
          [121, 25],
          [122, 26],
        ]
    }
  }

  beforeEach(async () => {
    routeFindManyArgs = []
    routeFindFirstArgs = []
    app = await createE2eApp({
      configureModule: (builder) =>
        builder.overrideProvider(PrismaService).useValue({
          $disconnect: () => Promise.resolve(),
          route: {
            findMany: (args: unknown) => {
              routeFindManyArgs.push(args)

              return Promise.resolve([
                {
                  uuid: 'TPE-route-1',
                  city: PrismaCityNameType.TAIPEI,
                  name_zh_tw: '307',
                  name_en: '307',
                  departure_zh_tw: '板橋',
                  departure_en: 'Banqiao',
                  destination_zh_tw: '撫遠街',
                  destination_en: 'Fuyuan St.',
                },
              ])
            },
            findFirst: (args: RouteFindFirstArgs) => {
              routeFindFirstArgs.push(args)

              if (args.where?.uuid === 'missing-route') {
                return Promise.resolve(null)
              }

              const routeShapePath = routeShapePathFor(args.where?.uuid)
              const routeShape =
                args.where?.uuid === 'route-without-shape'
                  ? null
                  : {
                      path: routeShapePath,
                      is_active: true,
                      tdx_updated_at: new Date('2026-07-10T00:00:00.000Z'),
                      updated_at: new Date('2026-07-11T00:00:00.000Z'),
                    }

              return Promise.resolve({
                uuid:
                  typeof args.where?.uuid === 'string'
                    ? args.where.uuid
                    : 'TPE-route-1',
                city: PrismaCityNameType.TAIPEI,
                name_zh_tw: '307',
                name_en: '307',
                departure_zh_tw: '板橋',
                departure_en: 'Banqiao',
                destination_zh_tw: '撫遠街',
                destination_en: 'Fuyuan St.',
                subroutes: [
                  {
                    uuid: 'TPE-subroute-1',
                    direction: PrismaDirectionType.GO,
                    name_zh_tw: '307',
                    name_en: '307',
                    departure_zh_tw: '板橋',
                    departure_en: 'Banqiao',
                    destination_zh_tw: '撫遠街',
                    destination_en: 'Fuyuan St.',
                    first_bus_time: '05:30',
                    last_bus_time: '23:00',
                    tdx_updated_at: new Date('2026-07-08T00:00:00.000Z'),
                    updated_at: new Date('2026-07-12T00:00:00.000Z'),
                    route_shape: routeShape,
                    route_stops: [
                      {
                        sequence: 1,
                        stop: {
                          uuid: 'TPE-stop-1',
                          name_zh_tw: '板橋站',
                          name_en: 'Banqiao Station',
                          latitude: 25,
                          longitude: 121,
                          tdx_updated_at: new Date('2026-07-09T00:00:00.000Z'),
                          updated_at: new Date('2026-07-13T00:00:00.000Z'),
                        },
                      },
                    ],
                  },
                ],
              })
            },
          },
        }),
    })
  })

  afterEach(async () => {
    await app.close()
  })

  it('/api/routes (GET) returns route search results for a valid area', () => {
    return request(app.getHttpServer())
      .get('/api/routes')
      .query({ area: AreaType.TAIPEI })
      .expect(200)
      .expect(({ body }: { body: ApiSuccessResponse<RoutesResponseDto> }) => {
        expect(body.data.routes).toEqual([
          {
            uuid: 'TPE-route-1',
            city: CityNameType.TAIPEI,
            name: { 'zh-TW': '307', en: '307' },
            departure: { 'zh-TW': '板橋', en: 'Banqiao' },
            destination: { 'zh-TW': '撫遠街', en: 'Fuyuan St.' },
          },
        ])
        expect(routeFindManyArgs).toEqual([
          expect.objectContaining({
            where: {
              city: {
                in: [PrismaCityNameType.TAIPEI, PrismaCityNameType.NEW_TAIPEI],
              },
              is_active: true,
            },
          }),
        ])
      })
  })

  it('/api/routes/:uuid (GET) returns route detail data', () => {
    const routeUuid = 'TPE-route-1'

    return request(app.getHttpServer())
      .get(`/api/routes/${routeUuid}`)
      .expect(200)
      .expect(
        ({ body }: { body: ApiSuccessResponse<RouteDetailResponseDto> }) => {
          expect(body.status).toBe(200)
          expect(body.message).toBeNull()
          expect(body.data.uuid).toBe(routeUuid)
          expect(body.data.city).toBe(CityNameType.TAIPEI)
          expect(body.data.name).toEqual({ 'zh-TW': '307', en: '307' })
          expect(body.data.sub_routes).toEqual([
            expect.objectContaining({
              uuid: 'TPE-subroute-1',
              direction: DirectionType.GO,
              stops: [
                {
                  uuid: 'TPE-stop-1',
                  sequence: 1,
                  name: {
                    'zh-TW': '板橋站',
                    en: 'Banqiao Station',
                  },
                  position: { latitude: 25, longitude: 121 },
                },
              ],
              shape: {
                path: [
                  [121, 25],
                  [122, 26],
                ],
                updated_at: '2026-07-10T00:00:00.000Z',
              },
            }),
          ])
          expect(routeFindFirstArgs).toEqual([
            expect.objectContaining({
              where: { uuid: routeUuid, is_active: true },
            }),
          ])
        },
      )
  })

  it('/api/routes/:uuid (GET) falls back to ordered stop positions when shape data is malformed', () => {
    return request(app.getHttpServer())
      .get('/api/routes/route-with-malformed-shape')
      .expect(200)
      .expect(
        ({ body }: { body: ApiSuccessResponse<RouteDetailResponseDto> }) => {
          expect(body.data.sub_routes[0]?.shape).toEqual({
            path: [[121, 25]],
            updated_at: '2026-07-09T00:00:00.000Z',
          })
        },
      )
  })

  it('/api/routes/:uuid (GET) falls back to ordered stop positions when shape data is partially malformed', () => {
    return request(app.getHttpServer())
      .get('/api/routes/route-with-partial-shape')
      .expect(200)
      .expect(
        ({ body }: { body: ApiSuccessResponse<RouteDetailResponseDto> }) => {
          expect(body.data.sub_routes[0]?.shape).toEqual({
            path: [[121, 25]],
            updated_at: '2026-07-09T00:00:00.000Z',
          })
        },
      )
  })

  it('/api/routes/:uuid (GET) falls back to ordered stop positions when shape points have extra values', () => {
    return request(app.getHttpServer())
      .get('/api/routes/route-with-extra-shape-point')
      .expect(200)
      .expect(
        ({ body }: { body: ApiSuccessResponse<RouteDetailResponseDto> }) => {
          expect(body.data.sub_routes[0]?.shape).toEqual({
            path: [[121, 25]],
            updated_at: '2026-07-09T00:00:00.000Z',
          })
        },
      )
  })

  it('/api/routes/:uuid (GET) falls back to ordered stop positions when shape points are non-finite', () => {
    return request(app.getHttpServer())
      .get('/api/routes/route-with-non-finite-shape-point')
      .expect(200)
      .expect(
        ({ body }: { body: ApiSuccessResponse<RouteDetailResponseDto> }) => {
          expect(body.data.sub_routes[0]?.shape).toEqual({
            path: [[121, 25]],
            updated_at: '2026-07-09T00:00:00.000Z',
          })
        },
      )
  })

  it('/api/routes/:uuid (GET) falls back to ordered stop positions when shape data is missing', () => {
    return request(app.getHttpServer())
      .get('/api/routes/route-without-shape')
      .expect(200)
      .expect(
        ({ body }: { body: ApiSuccessResponse<RouteDetailResponseDto> }) => {
          expect(body.data.sub_routes[0]?.shape).toEqual({
            path: [[121, 25]],
            updated_at: '2026-07-09T00:00:00.000Z',
          })
        },
      )
  })

  it('/api/routes/:uuid (GET) returns 404 when route is missing', () => {
    return request(app.getHttpServer())
      .get('/api/routes/missing-route')
      .expect(404)
      .expect(({ body }: { body: ApiErrorResponse }) => {
        expect(body.error.code).toBe(ErrorCode.ROUTE_NOT_FOUND)
        expect(routeFindFirstArgs).toEqual([
          expect.objectContaining({
            where: { uuid: 'missing-route', is_active: true },
          }),
        ])
      })
  })

  it('/api/routes (GET) rejects requests without area', () => {
    return request(app.getHttpServer())
      .get('/api/routes')
      .expect(400)
      .expect(({ body }: { body: ApiErrorResponse }) => {
        expect(body.error.code).toBe(ErrorCode.SYSTEM_BAD_REQUEST)
      })
  })

  it('/api/routes (GET) rejects invalid area values', () => {
    return request(app.getHttpServer())
      .get('/api/routes')
      .query({ area: 'InvalidArea' })
      .expect(400)
      .expect(({ body }: { body: ApiErrorResponse }) => {
        expect(body.error.code).toBe(ErrorCode.SYSTEM_BAD_REQUEST)
      })
  })
})

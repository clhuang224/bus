import { type INestApplication } from '@nestjs/common'
import request from 'supertest'
import {
  BearingType,
  CityNameType,
  DirectionType,
  ErrorCode,
  type ApiErrorResponse,
  type ApiSuccessResponse,
} from '@bus/shared'
import {
  BearingType as PrismaBearingType,
  CityNameType as PrismaCityNameType,
  DirectionType as PrismaDirectionType,
} from '../src/generated/prisma/enums.js'
import type { StationFindManyArgs } from '../src/generated/prisma/models/Station.js'
import { PrismaService } from '../src/prisma/prisma.service.js'
import type { StationsResponseDto } from '../src/stations/dto/stations-response.dto.js'
import { createE2eApp } from './create-e2e-app.js'

describe('Stations API (e2e)', () => {
  let app: INestApplication
  let stationFindManyArgs: unknown[]

  const isNumberRange = (value: unknown) =>
    typeof value === 'object' &&
    value !== null &&
    'gte' in value &&
    'lte' in value &&
    typeof value.gte === 'number' &&
    typeof value.lte === 'number'

  beforeEach(async () => {
    stationFindManyArgs = []
    app = await createE2eApp({
      configureModule: (builder) =>
        builder.overrideProvider(PrismaService).useValue({
          $disconnect: () => Promise.resolve(),
          station: {
            findMany: (args: StationFindManyArgs) => {
              stationFindManyArgs.push(args)

              return Promise.resolve([
                {
                  uuid: 'NWT-station-1',
                  city: PrismaCityNameType.NEW_TAIPEI,
                  name_zh_tw: '捷運景安站',
                  name_en: 'MRT Jingan Sta.',
                  address_zh_tw: '景平路近景安路',
                  address_en: 'Jingping Rd. near Jingan Rd.',
                  latitude: 24.9939,
                  longitude: 121.5047,
                  bearing: PrismaBearingType.EAST,
                  stops: [
                    {
                      route_stops: [
                        {
                          subroute: {
                            direction: PrismaDirectionType.GO,
                            route: {
                              uuid: 'NWT-route-242',
                              city: PrismaCityNameType.NEW_TAIPEI,
                              name_zh_tw: '242',
                              name_en: '242',
                              departure_zh_tw: '中和',
                              departure_en: 'Zhonghe',
                              destination_zh_tw: '西門',
                              destination_en: 'Ximen',
                            },
                          },
                        },
                        {
                          subroute: {
                            direction: PrismaDirectionType.GO,
                            route: {
                              uuid: 'NWT-route-242',
                              city: PrismaCityNameType.NEW_TAIPEI,
                              name_zh_tw: '242',
                              name_en: '242',
                              departure_zh_tw: '中和',
                              departure_en: 'Zhonghe',
                              destination_zh_tw: '西門',
                              destination_en: 'Ximen',
                            },
                          },
                        },
                        {
                          subroute: {
                            direction: PrismaDirectionType.RETURN,
                            route: {
                              uuid: 'NWT-route-BR7',
                              city: PrismaCityNameType.NEW_TAIPEI,
                              name_zh_tw: '棕7',
                              name_en: 'BR7',
                              departure_zh_tw: '新店',
                              departure_en: 'Xindian Station',
                              destination_zh_tw: '臺北市政府',
                              destination_en: 'Taipei City Hall',
                            },
                          },
                        },
                      ],
                    },
                  ],
                },
                {
                  uuid: 'NWT-station-outside-radius',
                  city: PrismaCityNameType.NEW_TAIPEI,
                  name_zh_tw: '遠方站',
                  name_en: 'Far Station',
                  address_zh_tw: null,
                  address_en: null,
                  latitude: 24.999,
                  longitude: 121.5047,
                  bearing: null,
                  stops: [],
                },
              ])
            },
          },
        }),
    })
  })

  afterEach(async () => {
    await app.close()
  })

  it('/api/stations (GET) returns nearby station groups for valid coordinates', () => {
    return request(app.getHttpServer())
      .get('/api/stations')
      .query({ latitude: 24.9939, longitude: 121.5047 })
      .expect(200)
      .expect(({ body }: { body: ApiSuccessResponse<StationsResponseDto> }) => {
        expect(body.data.stations).toEqual([
          {
            uuid: 'NWT-station-1',
            city: CityNameType.NEW_TAIPEI,
            name: { 'zh-TW': '捷運景安站', en: 'MRT Jingan Sta.' },
            address: '景平路近景安路',
            bearing: BearingType.EAST,
            position: { latitude: 24.9939, longitude: 121.5047 },
            distance_meters: 0,
            route_directions: [
              {
                direction: DirectionType.GO,
                routes: [
                  {
                    uuid: 'NWT-route-242',
                    city: CityNameType.NEW_TAIPEI,
                    name: { 'zh-TW': '242', en: '242' },
                    departure: { 'zh-TW': '中和', en: 'Zhonghe' },
                    destination: { 'zh-TW': '西門', en: 'Ximen' },
                  },
                ],
              },
              {
                direction: DirectionType.RETURN,
                routes: [
                  {
                    uuid: 'NWT-route-BR7',
                    city: CityNameType.NEW_TAIPEI,
                    name: { 'zh-TW': '棕7', en: 'BR7' },
                    departure: { 'zh-TW': '新店', en: 'Xindian Station' },
                    destination: {
                      'zh-TW': '臺北市政府',
                      en: 'Taipei City Hall',
                    },
                  },
                ],
              },
            ],
          },
        ])
        expect(stationFindManyArgs).toHaveLength(1)
        const where = (
          stationFindManyArgs[0] as {
            where?: {
              is_active?: unknown
              latitude?: unknown
              longitude?: unknown
            }
          }
        ).where
        expect(where?.is_active).toBe(true)
        expect(isNumberRange(where?.latitude)).toBe(true)
        expect(isNumberRange(where?.longitude)).toBe(true)
      })
  })

  it('/api/stations (GET) returns an empty list when no stations are within radius', () => {
    return request(app.getHttpServer())
      .get('/api/stations')
      .query({ latitude: 23, longitude: 120 })
      .expect(200)
      .expect(({ body }: { body: ApiSuccessResponse<StationsResponseDto> }) => {
        expect(body.data.stations).toEqual([])
      })
  })

  it('/api/stations (GET) rejects radius values above 3000 meters', () => {
    return request(app.getHttpServer())
      .get('/api/stations')
      .query({ latitude: 24.9939, longitude: 121.5047, radius_meters: 3001 })
      .expect(400)
      .expect(({ body }: { body: ApiErrorResponse }) => {
        expect(body.error.code).toBe(ErrorCode.SYSTEM_BAD_REQUEST)
      })
  })

  it('/api/stations (GET) rejects radius values below 500 meters', () => {
    return request(app.getHttpServer())
      .get('/api/stations')
      .query({ latitude: 24.9939, longitude: 121.5047, radius_meters: 499 })
      .expect(400)
      .expect(({ body }: { body: ApiErrorResponse }) => {
        expect(body.error.code).toBe(ErrorCode.SYSTEM_BAD_REQUEST)
      })
  })

  it('/api/stations (GET) rejects requests without latitude', () => {
    return request(app.getHttpServer())
      .get('/api/stations')
      .query({ longitude: 121.5047 })
      .expect(400)
      .expect(({ body }: { body: ApiErrorResponse }) => {
        expect(body.error.code).toBe(ErrorCode.SYSTEM_BAD_REQUEST)
      })
  })

  it('/api/stations (GET) rejects requests without longitude', () => {
    return request(app.getHttpServer())
      .get('/api/stations')
      .query({ latitude: 24.9939 })
      .expect(400)
      .expect(({ body }: { body: ApiErrorResponse }) => {
        expect(body.error.code).toBe(ErrorCode.SYSTEM_BAD_REQUEST)
      })
  })
})

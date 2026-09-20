import { type INestApplication } from '@nestjs/common'
import request from 'supertest'
import {
  BearingType,
  CityNameType,
  DirectionType,
  type ApiSuccessResponse,
} from '@bus/shared'
import {
  BearingType as PrismaBearingType,
  CityNameType as PrismaCityNameType,
  DirectionType as PrismaDirectionType,
} from '../src/generated/prisma/enums.js'
import type {
  StationFindManyArgs,
  StationGetPayload,
} from '../src/generated/prisma/models/Station.js'
import type {
  StopFindManyArgs,
  StopGetPayload,
} from '../src/generated/prisma/models/Stop.js'
import { PrismaService } from '../src/prisma/prisma.service.js'
import type { StationsResponseDto } from '../src/stations/dto/stations-response.dto.js'
import type {
  standaloneStopSelect,
  stationSelect,
} from '../src/stations/station-query.js'
import { createE2eApp } from './create-e2e-app.js'

type StationRecord = StationGetPayload<{ select: typeof stationSelect }>
type StandaloneStopRecord = StopGetPayload<{
  select: typeof standaloneStopSelect
}>

const standaloneStop: StandaloneStopRecord = {
  uuid: 'NWT1001',
  city: PrismaCityNameType.NEW_TAIPEI,
  name_zh_tw: '獨立站牌',
  name_en: 'Standalone Stop',
  address_zh_tw: '景平路 1 號',
  address_en: '1 Jingping Road',
  latitude: 24.9939,
  longitude: 121.5047,
  bearing: PrismaBearingType.EAST,
  route_stops: [
    {
      subroute: {
        direction: PrismaDirectionType.GO,
        route: {
          uuid: 'NWT242',
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
  ],
}

describe('Standalone stops in Stations API (e2e)', () => {
  let app: INestApplication
  let stations: StationRecord[]
  let stops: StandaloneStopRecord[]
  let stationQueries: StationFindManyArgs[]
  let stopQueries: StopFindManyArgs[]

  beforeEach(async () => {
    stations = []
    stops = [standaloneStop]
    stationQueries = []
    stopQueries = []
    app = await createE2eApp({
      configureModule: (builder) =>
        builder.overrideProvider(PrismaService).useValue({
          $disconnect: () => Promise.resolve(),
          station: {
            findMany: (args: StationFindManyArgs) => {
              stationQueries.push(args)
              return Promise.resolve(stations)
            },
          },
          stop: {
            findMany: (args: StopFindManyArgs) => {
              stopQueries.push(args)
              return Promise.resolve(stops)
            },
          },
        }),
    })
  })

  afterEach(async () => {
    await app.close()
  })

  const nearbyQuery = { latitude: 24.9939, longitude: 121.5047 }

  it('returns a standalone stop with its address, bearing, and routes when no stations are nearby', async () => {
    await request(app.getHttpServer())
      .get('/api/stations')
      .query(nearbyQuery)
      .expect(200)
      .expect(({ body }: { body: ApiSuccessResponse<StationsResponseDto> }) => {
        expect(body.data.stations).toEqual([
          {
            uuid: 'stop:NWT1001',
            city: CityNameType.NEW_TAIPEI,
            name: { 'zh-TW': '獨立站牌', en: 'Standalone Stop' },
            address: { 'zh-TW': '景平路 1 號', en: '1 Jingping Road' },
            bearing: BearingType.EAST,
            position: { latitude: 24.9939, longitude: 121.5047 },
            distance_meters: 0,
            route_directions: [
              {
                direction: DirectionType.GO,
                routes: [
                  {
                    uuid: 'NWT242',
                    city: CityNameType.NEW_TAIPEI,
                    name: { 'zh-TW': '242', en: '242' },
                    departure: { 'zh-TW': '中和', en: 'Zhonghe' },
                    destination: { 'zh-TW': '西門', en: 'Ximen' },
                  },
                ],
              },
            ],
          },
        ])
      })

    expect(stationQueries).toHaveLength(1)
    expect(stopQueries).toHaveLength(1)
    expect(stopQueries[0].where).toEqual({
      ...stationQueries[0].where,
      is_active: true,
      station_id: null,
    })
    expect(stopQueries[0].select).toMatchObject({
      route_stops: {
        where: {
          is_active: true,
          subroute: { is_active: true, route: { is_active: true } },
        },
      },
    })
  })

  it('keeps station and stop identities separate and sorts both sources by distance', async () => {
    stations = [
      {
        ...standaloneStop,
        name_zh_tw: '正式站點',
        latitude: 24.9949,
        stops: [],
      },
    ]
    stops = [
      { ...standaloneStop, uuid: 'NWT1002', latitude: 24.9959 },
      standaloneStop,
    ]

    await request(app.getHttpServer())
      .get('/api/stations')
      .query(nearbyQuery)
      .expect(200)
      .expect(({ body }: { body: ApiSuccessResponse<StationsResponseDto> }) => {
        expect(body.data.stations.map(({ uuid }) => uuid)).toEqual([
          'stop:NWT1001',
          'NWT1001',
          'stop:NWT1002',
        ])
      })
  })

  it('filters standalone stops by precise radius before rounding distances', async () => {
    const earthRadiusMeters = 6_371_000
    stops = [499.8, 500.2].map((distanceMeters) => ({
      ...standaloneStop,
      uuid: `NWT-${distanceMeters}`,
      latitude:
        nearbyQuery.latitude +
        (distanceMeters / earthRadiusMeters) * (180 / Math.PI),
    }))

    await request(app.getHttpServer())
      .get('/api/stations')
      .query({ ...nearbyQuery, radius_meters: 500 })
      .expect(200)
      .expect(({ body }: { body: ApiSuccessResponse<StationsResponseDto> }) => {
        expect(body.data.stations).toHaveLength(1)
        expect(body.data.stations[0]).toMatchObject({
          uuid: 'stop:NWT-499.8',
          distance_meters: 500,
        })
      })
  })
})

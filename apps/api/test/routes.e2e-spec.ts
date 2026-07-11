import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { AreaType, CityNameType, DirectionType } from '@bus/shared'
import {
  CityNameType as PrismaCityNameType,
  DirectionType as PrismaDirectionType,
} from '../src/generated/prisma/enums.js'
import { PrismaService } from '../src/prisma/prisma.service.js'
import { createE2eApp } from './create-e2e-app.js'

describe('Routes API (e2e)', () => {
  let app: INestApplication
  let routeFindManyArgs: unknown[]
  let routeFindFirstArgs: Array<{ where?: { uuid?: string } }>

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
            findFirst: (args: { where?: { uuid?: string } }) => {
              routeFindFirstArgs.push(args)

              if (args.where?.uuid === 'missing-route') {
                return Promise.resolve(null)
              }

              return Promise.resolve({
                uuid: 'TPE-route-1',
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
                    route_shape: {
                      path: [
                        [121, 25],
                        [122, 26],
                      ],
                      tdx_updated_at: new Date('2026-07-10T00:00:00.000Z'),
                      updated_at: new Date('2026-07-11T00:00:00.000Z'),
                    },
                    route_stops: [
                      {
                        sequence: 1,
                        stop: {
                          uuid: 'TPE-stop-1',
                          name_zh_tw: '板橋站',
                          name_en: 'Banqiao Station',
                          latitude: 25,
                          longitude: 121,
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
      .expect(({ body }: { body: { routes: unknown[] } }) => {
        expect(body.routes).toEqual([
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
        ({
          body,
        }: {
          body: {
            uuid: string
            city: CityNameType
            name: { 'zh-TW': string; en: string }
            sub_routes: Array<{
              uuid: string
              direction: DirectionType
              stops: Array<{
                uuid: string
                sequence: number
                name: { 'zh-TW': string; en: string }
                position: { latitude: number; longitude: number }
              }>
              shape: {
                path: Array<{ latitude: number; longitude: number }>
                updated_at: string
              }
            }>
          }
        }) => {
          expect(body.uuid).toBe(routeUuid)
          expect(body.city).toBe(CityNameType.TAIPEI)
          expect(body.name).toEqual({ 'zh-TW': '307', en: '307' })
          expect(body.sub_routes).toEqual([
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
                  { latitude: 25, longitude: 121 },
                  { latitude: 26, longitude: 122 },
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

  it('/api/routes/:uuid (GET) returns 404 when route is missing', () => {
    return request(app.getHttpServer())
      .get('/api/routes/missing-route')
      .expect(404)
      .expect(() => {
        expect(routeFindFirstArgs).toEqual([
          expect.objectContaining({
            where: { uuid: 'missing-route', is_active: true },
          }),
        ])
      })
  })

  it('/api/routes (GET) rejects requests without area', () => {
    return request(app.getHttpServer()).get('/api/routes').expect(400)
  })

  it('/api/routes (GET) rejects invalid area values', () => {
    return request(app.getHttpServer())
      .get('/api/routes')
      .query({ area: 'InvalidArea' })
      .expect(400)
  })
})

import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { AreaType, CityNameType } from '@bus/shared'
import { CityNameType as PrismaCityNameType } from '../src/generated/prisma/enums.js'
import { PrismaService } from '../src/prisma/prisma.service.js'
import { createE2eApp } from './create-e2e-app.js'

describe('Routes API (e2e)', () => {
  let app: INestApplication
  let routeFindManyArgs: unknown[]

  beforeEach(async () => {
    routeFindManyArgs = []
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

  it('/api/routes/:uuid (GET) returns route detail placeholder data', () => {
    const routeUuid = 'route-1'
    return request(app.getHttpServer())
      .get(`/api/routes/${routeUuid}`)
      .expect(200)
      .expect(
        ({
          body,
        }: {
          body: {
            uuid: string
            city: string | null
            name: { 'zh-TW': string; en: string }
            sub_routes: unknown[]
          }
        }) => {
          expect(body.uuid).toBe(routeUuid)
          expect(body.city).toBeNull()
          expect(body.name).toEqual({ 'zh-TW': '', en: '' })
          expect(Array.isArray(body.sub_routes)).toBe(true)
        },
      )
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

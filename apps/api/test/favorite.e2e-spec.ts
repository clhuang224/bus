import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { CityNameType, DirectionType } from '@bus/shared'
import { createE2eApp } from './create-e2e-app.js'

describe('Favorite API (e2e)', () => {
  let app: INestApplication

  beforeEach(async () => {
    app = await createE2eApp()
  })

  afterEach(async () => {
    await app.close()
  })

  it('/api/favorite/route-stops (GET) returns favorite route stops', () => {
    // Nest's HTTP adapter exposes the raw server as `any`.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return request(app.getHttpServer())
      .get('/api/favorite/route-stops')
      .expect(200)
      .expect(({ body }: { body: { route_stops: unknown[] } }) => {
        expect(Array.isArray(body.route_stops)).toBe(true)
      })
  })

  it('/api/favorite/route-stops (POST) creates a favorite route stop placeholder', () => {
    const payload = {
      uuid: 'TPE16111-TPE157463-0-60094',
      city: CityNameType.TAIPEI,
      route: {
        uuid: 'TPE16111',
        name: { 'zh-TW': '307', en: '307' },
      },
      sub_route: {
        uuid: 'TPE157463',
        name: { 'zh-TW': '307莒光往撫遠街', en: '307' },
        direction: DirectionType.GO,
        departure: { 'zh-TW': '板橋', en: 'Banqiao' },
        destination: { 'zh-TW': '撫遠街', en: 'Fuyuan St.' },
      },
      stop: {
        uuid: 'TPE15204',
        id: '15204',
        station_id: '60094',
        station_key: '60094',
        name: { 'zh-TW': '北門街(黃石市場)', en: 'Beimen St.' },
        sequence: 10,
      },
    }

    // Nest's HTTP adapter exposes the raw server as `any`.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return request(app.getHttpServer())
      .post('/api/favorite/route-stops')
      .send(payload)
      .expect(201)
      .expect(({ body }: { body: typeof payload }) => {
        expect(body).toEqual(payload)
      })
  })

  it('/api/favorite/route-stops/:uuid (DELETE) removes a favorite route stop', () => {
    // Nest's HTTP adapter exposes the raw server as `any`.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return request(app.getHttpServer())
      .delete('/api/favorite/route-stops/test-favorite')
      .expect(204)
  })
})

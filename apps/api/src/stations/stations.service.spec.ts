import { Test } from '@nestjs/testing'
import type { ApiLocalizedText } from '@bus/shared'
import { CityNameType } from '../generated/prisma/enums.js'
import type { StopModel } from '../generated/prisma/models/Stop.js'
import { PrismaService } from '../prisma/prisma.service.js'
import { StationsService } from './stations.service.js'

type AddressRecord = Pick<StopModel, 'address_zh_tw' | 'address_en'>

describe('StationsService addresses', () => {
  it.each<{
    scenario: string
    stationAddress: AddressRecord
    stopAddresses: AddressRecord[]
    expected: ApiLocalizedText | null
  }>([
    {
      scenario: 'merges stop addresses when the station has no address',
      stationAddress: { address_zh_tw: null, address_en: null },
      stopAddresses: [
        { address_zh_tw: '市府路 1 號', address_en: '1 City Hall Road' },
        { address_zh_tw: '松高路 2 號', address_en: '2 Songgao Road' },
      ],
      expected: {
        'zh-TW': '市府路 1 號、松高路 2 號',
        en: '1 City Hall Road; 2 Songgao Road',
      },
    },
    {
      scenario:
        'merges station and stop addresses without duplicates or blanks',
      stationAddress: {
        address_zh_tw: '市府路 1 號',
        address_en: '1 City Hall Road',
      },
      stopAddresses: [
        { address_zh_tw: ' 市府路 1 號 ', address_en: '1 City Hall Road' },
        { address_zh_tw: '松高路 2 號', address_en: null },
        { address_zh_tw: '松高路 2 號', address_en: '2 Songgao Road' },
        { address_zh_tw: ' ', address_en: '' },
      ],
      expected: {
        'zh-TW': '市府路 1 號、松高路 2 號',
        en: '1 City Hall Road; 2 Songgao Road',
      },
    },
    {
      scenario:
        'keeps translated stop addresses when only English is available',
      stationAddress: { address_zh_tw: null, address_en: null },
      stopAddresses: [{ address_zh_tw: null, address_en: '1 City Hall Road' }],
      expected: { 'zh-TW': '', en: '1 City Hall Road' },
    },
    {
      scenario: 'returns null when station and stop addresses are empty',
      stationAddress: { address_zh_tw: null, address_en: null },
      stopAddresses: [{ address_zh_tw: ' ', address_en: null }],
      expected: null,
    },
    {
      scenario: 'preserves the station address when it has no active stops',
      stationAddress: { address_zh_tw: '市府路 1 號', address_en: null },
      stopAddresses: [],
      expected: { 'zh-TW': '市府路 1 號', en: '' },
    },
  ])('$scenario', async ({ stationAddress, stopAddresses, expected }) => {
    const station = {
      uuid: 'TPE-station-1',
      city: CityNameType.TAIPEI,
      name_zh_tw: '市政府',
      name_en: 'City Hall',
      ...stationAddress,
      latitude: 25.033,
      longitude: 121.5654,
      bearing: null,
      stops: stopAddresses.map((address) => ({ ...address, route_stops: [] })),
    }
    const module = await Test.createTestingModule({
      providers: [
        StationsService,
        {
          provide: PrismaService,
          useValue: {
            station: { findMany: () => Promise.resolve([station]) },
            stop: { findMany: () => Promise.resolve([]) },
          },
        },
      ],
    }).compile()
    const service = module.get(StationsService)

    const response = await service.listStations({
      latitude: 25.033,
      longitude: 121.5654,
    })

    expect(response.stations).toHaveLength(1)
    expect(response.stations[0].address).toEqual(expected)
    await module.close()
  })
})

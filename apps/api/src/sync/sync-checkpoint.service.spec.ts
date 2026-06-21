import { CityNameType } from '@bus/shared'
import { Test } from '@nestjs/testing'
import type { Prisma } from '../generated/prisma/client.js'
import { SyncStatusType as PrismaSyncStatusType } from '../generated/prisma/enums.js'
import { PrismaService } from '../prisma/prisma.service.js'
import { cityMapper } from './mappers/route.mapper.js'
import { SyncCheckpointService } from './sync-checkpoint.service.js'
import { TdxMonthlyQuotaExceededError } from './tdx-client.service.js'

describe('SyncCheckpointService', () => {
  it('marks a city and run pending when monthly quota is exhausted', async () => {
    const retryAt = new Date('2026-07-01T00:00:00.000Z')
    const quotaError = new TdxMonthlyQuotaExceededError(
      'TDX monthly request quota has been exhausted.',
      retryAt,
    )
    const cityUpdates: Prisma.SyncRunCityUpdateArgs[] = []
    const runUpdates: Prisma.SyncRunUpdateArgs[] = []
    const prismaService = {
      syncRun: {
        update: (args: Prisma.SyncRunUpdateArgs) => {
          runUpdates.push(args)
          return Promise.resolve({})
        },
      },
      syncRunCity: {
        update: (args: Prisma.SyncRunCityUpdateArgs) => {
          cityUpdates.push(args)
          return Promise.resolve({})
        },
      },
    }
    const module = await Test.createTestingModule({
      providers: [
        SyncCheckpointService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile()
    const service = module.get(SyncCheckpointService)
    const result = {
      records_read: 0,
      records_created: 0,
      records_updated: 0,
      records_deactivated: 0,
    }

    await service.failCity('sync-run-id', CityNameType.TAIPEI, quotaError)
    await service.failRun('sync-run-id', quotaError, result)

    expect(cityUpdates).toEqual([
      {
        where: {
          sync_run_id_city: {
            sync_run_id: 'sync-run-id',
            city: cityMapper(CityNameType.TAIPEI),
          },
        },
        data: {
          status: PrismaSyncStatusType.PENDING,
          finished_at: null,
          error_message: quotaError.message,
        },
      },
    ])
    expect(runUpdates).toEqual([
      {
        where: { id: 'sync-run-id' },
        data: {
          status: PrismaSyncStatusType.PENDING,
          resume_after_at: retryAt,
          finished_at: null,
          error_message: quotaError.message,
          ...result,
        },
      },
    ])
  })
})

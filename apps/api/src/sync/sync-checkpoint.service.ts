import { Injectable } from '@nestjs/common'
import type { CityNameType } from '@bus/shared'
import { SyncStatusType as PrismaSyncStatusType } from '../generated/prisma/enums.js'
import { PrismaService } from '../prisma/prisma.service.js'
import { cityMapper } from './mappers/route.mapper.js'
import type { SyncResult } from './sync-result.js'
import { TdxMonthlyQuotaExceededError } from './tdx-client.service.js'

@Injectable()
export class SyncCheckpointService {
  constructor(private readonly prismaService: PrismaService) {}

  async startRun(syncRunId: string): Promise<void> {
    await this.prismaService.syncRun.update({
      where: { id: syncRunId },
      data: {
        status: PrismaSyncStatusType.RUNNING,
        started_at: new Date(),
        finished_at: null,
        resume_after_at: null,
        error_message: null,
      },
    })
  }

  async ensureCities(syncRunId: string, cities: CityNameType[]): Promise<void> {
    await this.prismaService.syncRunCity.createMany({
      data: cities.map((city) => ({
        sync_run_id: syncRunId,
        city: cityMapper(city),
      })),
      skipDuplicates: true,
    })
  }

  async getCompletedCities(syncRunId: string) {
    const checkpoints = await this.prismaService.syncRunCity.findMany({
      where: {
        sync_run_id: syncRunId,
        status: PrismaSyncStatusType.SUCCEEDED,
      },
      select: {
        city: true,
        records_read: true,
        records_created: true,
        records_updated: true,
        records_deactivated: true,
      },
    })

    return new Map(
      checkpoints.map((checkpoint) => [checkpoint.city, checkpoint]),
    )
  }

  async startCity(syncRunId: string, city: CityNameType): Promise<void> {
    await this.prismaService.syncRunCity.update({
      where: this.cityWhere(syncRunId, city),
      data: {
        status: PrismaSyncStatusType.RUNNING,
        started_at: new Date(),
        finished_at: null,
        error_message: null,
      },
    })
  }

  async completeCity(
    syncRunId: string,
    city: CityNameType,
    result: SyncResult,
  ): Promise<void> {
    await this.prismaService.syncRunCity.update({
      where: this.cityWhere(syncRunId, city),
      data: {
        status: PrismaSyncStatusType.SUCCEEDED,
        finished_at: new Date(),
        error_message: null,
        ...result,
      },
    })
  }

  async updateRunResult(syncRunId: string, result: SyncResult): Promise<void> {
    await this.prismaService.syncRun.update({
      where: { id: syncRunId },
      data: result,
    })
  }

  async touch(syncRunId: string, city: CityNameType): Promise<void> {
    const now = new Date()

    await this.prismaService.syncRun.update({
      where: { id: syncRunId },
      data: { updated_at: now },
    })
    await this.prismaService.syncRunCity.update({
      where: this.cityWhere(syncRunId, city),
      data: { updated_at: now },
    })
  }

  async completeRun(syncRunId: string, result: SyncResult): Promise<void> {
    await this.prismaService.syncRun.update({
      where: { id: syncRunId },
      data: {
        status: PrismaSyncStatusType.SUCCEEDED,
        finished_at: new Date(),
        ...result,
      },
    })
  }

  async failCity(
    syncRunId: string,
    city: CityNameType,
    error: unknown,
  ): Promise<void> {
    const isPending = error instanceof TdxMonthlyQuotaExceededError

    await this.prismaService.syncRunCity.update({
      where: this.cityWhere(syncRunId, city),
      data: {
        status: isPending
          ? PrismaSyncStatusType.PENDING
          : PrismaSyncStatusType.FAILED,
        finished_at: isPending ? null : new Date(),
        error_message: this.errorMessage(error),
      },
    })
  }

  async failRun(
    syncRunId: string,
    error: unknown,
    result: SyncResult,
  ): Promise<void> {
    if (error instanceof TdxMonthlyQuotaExceededError) {
      await this.prismaService.syncRun.update({
        where: { id: syncRunId },
        data: {
          status: PrismaSyncStatusType.PENDING,
          resume_after_at: error.retry_at,
          finished_at: null,
          error_message: this.errorMessage(error),
          ...result,
        },
      })

      return
    }

    await this.prismaService.syncRun.update({
      where: { id: syncRunId },
      data: {
        status: PrismaSyncStatusType.FAILED,
        finished_at: new Date(),
        error_message: this.errorMessage(error),
        ...result,
      },
    })
  }

  private cityWhere(syncRunId: string, city: CityNameType) {
    return {
      sync_run_id_city: {
        sync_run_id: syncRunId,
        city: cityMapper(city),
      },
    }
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error)
  }
}

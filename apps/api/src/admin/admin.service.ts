import { Injectable, NotFoundException } from '@nestjs/common'
import { CityNameType, SyncResourceType } from '@bus/shared'
import {
  API_SYNC_STATUS_BY_PRISMA,
  DB_CITY_NAME_BY_PRISMA,
} from '../constants/enum-mappings.js'
import {
  SyncResourceType as PrismaSyncResourceType,
  SyncStatusType as PrismaSyncStatusType,
  CityNameType as PrismaCityNameType,
} from '../generated/prisma/enums.js'
import { PrismaService } from '../prisma/prisma.service.js'
import {
  AdvisoryLockNamespace,
  SyncResourceLockId,
} from '../sync/advisory-lock.constants.js'
import { SyncService } from '../sync/sync.service.js'
import {
  SyncRunDetailResponseDto,
  SyncRunSummaryResponseDto,
} from './dto/sync-run-response.dto.js'
import { SyncResponseDto } from './dto/sync-response.dto.js'

const ACTIVE_SYNC_STATUSES: PrismaSyncStatusType[] = [
  PrismaSyncStatusType.QUEUED,
  PrismaSyncStatusType.RUNNING,
  PrismaSyncStatusType.PENDING,
]

const SYNC_RESOURCE_LOCK_IDS: Record<
  PrismaSyncResourceType,
  SyncResourceLockId
> = {
  [PrismaSyncResourceType.ROUTES]: SyncResourceLockId.ROUTES,
  [PrismaSyncResourceType.STOPS]: SyncResourceLockId.STOPS,
  [PrismaSyncResourceType.STATIONS]: SyncResourceLockId.STATIONS,
  [PrismaSyncResourceType.SHAPES]: SyncResourceLockId.SHAPES,
}

interface SyncRunRecord {
  id: string
  resource: PrismaSyncResourceType
  status: PrismaSyncStatusType
  created_at: Date
  updated_at: Date
  started_at: Date | null
  finished_at: Date | null
  resume_after_at: Date | null
  records_read: number
  records_created: number
  records_updated: number
  records_deactivated: number
  error_message: string | null
}

interface SyncRunCityRecord {
  city: PrismaCityNameType
  status: PrismaSyncStatusType
  started_at: Date | null
  finished_at: Date | null
  updated_at: Date
  records_read: number
  records_created: number
  records_updated: number
  records_deactivated: number
  error_message: string | null
}

type SyncRunDetailRecord = SyncRunRecord & {
  cities: SyncRunCityRecord[]
}

const SYNC_RUN_LIST_LIMIT = 20
const API_SYNC_RESOURCES = [
  PrismaSyncResourceType.ROUTES,
  PrismaSyncResourceType.STOPS,
] as const

@Injectable()
export class AdminService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly syncService: SyncService,
  ) {}

  async syncRoutes(): Promise<SyncResponseDto> {
    const response = await this.createSyncRun({
      apiResource: SyncResourceType.ROUTES,
      prismaResource: PrismaSyncResourceType.ROUTES,
    })

    if (response.uuid) {
      this.syncService.enqueue(response.uuid)
    }

    return response
  }

  async syncStops(): Promise<SyncResponseDto> {
    const response = await this.createSyncRun({
      apiResource: SyncResourceType.STOPS,
      prismaResource: PrismaSyncResourceType.STOPS,
    })

    if (response.uuid) {
      this.syncService.enqueue(response.uuid)
    }

    return response
  }

  async listSyncRuns(): Promise<SyncRunSummaryResponseDto[]> {
    const syncRuns = await this.prismaService.syncRun.findMany({
      where: {
        resource: { in: [...API_SYNC_RESOURCES] },
      },
      orderBy: { created_at: 'desc' },
      take: SYNC_RUN_LIST_LIMIT,
    })

    return syncRuns.map((syncRun) => this.toSyncRunSummary(syncRun))
  }

  async getSyncRun(uuid: string): Promise<SyncRunDetailResponseDto> {
    const syncRun = await this.prismaService.syncRun.findFirst({
      where: {
        id: uuid,
        resource: { in: [...API_SYNC_RESOURCES] },
      },
      include: {
        cities: {
          orderBy: { created_at: 'asc' },
        },
      },
    })

    if (!syncRun) {
      throw new NotFoundException(`Sync run ${uuid} was not found.`)
    }

    return this.toSyncRunDetail(syncRun)
  }

  private async createSyncRun({
    apiResource,
    prismaResource,
  }: {
    apiResource: SyncResourceType
    prismaResource: PrismaSyncResourceType
  }): Promise<SyncResponseDto> {
    const syncRun = await this.prismaService.$transaction(
      async (transaction) => {
        await transaction.$executeRaw`
          SELECT pg_advisory_xact_lock(
            ${AdvisoryLockNamespace.SYNC_RUN},
            ${SYNC_RESOURCE_LOCK_IDS[prismaResource]}
          )
        `

        const latestSyncRun = await transaction.syncRun.findFirst({
          where: {
            resource: prismaResource,
          },
          orderBy: { created_at: 'desc' },
        })

        if (
          latestSyncRun &&
          ACTIVE_SYNC_STATUSES.includes(latestSyncRun.status)
        ) {
          return latestSyncRun
        }

        if (latestSyncRun?.status === PrismaSyncStatusType.FAILED) {
          return transaction.syncRun.update({
            where: { id: latestSyncRun.id },
            data: {
              status: PrismaSyncStatusType.QUEUED,
              started_at: null,
              finished_at: null,
              resume_after_at: null,
              error_message: null,
            },
          })
        }

        return transaction.syncRun.create({
          data: {
            resource: prismaResource,
            status: PrismaSyncStatusType.QUEUED,
          },
        })
      },
    )

    return this.toSyncResponse(syncRun, apiResource)
  }

  private toSyncResponse(
    syncRun: SyncRunRecord,
    resource: SyncResourceType,
  ): SyncResponseDto {
    return {
      uuid: syncRun.id,
      resource,
      status: API_SYNC_STATUS_BY_PRISMA[syncRun.status],
      started_at: syncRun.started_at?.toISOString() ?? null,
      finished_at: syncRun.finished_at?.toISOString() ?? null,
      records_read: syncRun.records_read,
      records_created: syncRun.records_created,
      records_updated: syncRun.records_updated,
      records_deactivated: syncRun.records_deactivated,
      error_message: syncRun.error_message,
    }
  }

  private toSyncRunSummary(syncRun: SyncRunRecord): SyncRunSummaryResponseDto {
    return {
      uuid: syncRun.id,
      resource: this.toApiSyncResource(syncRun.resource),
      status: API_SYNC_STATUS_BY_PRISMA[syncRun.status],
      created_at: syncRun.created_at.toISOString(),
      updated_at: syncRun.updated_at.toISOString(),
      started_at: syncRun.started_at?.toISOString() ?? null,
      finished_at: syncRun.finished_at?.toISOString() ?? null,
      resume_after_at: syncRun.resume_after_at?.toISOString() ?? null,
      records_read: syncRun.records_read,
      records_created: syncRun.records_created,
      records_updated: syncRun.records_updated,
      records_deactivated: syncRun.records_deactivated,
      error_message: syncRun.error_message,
    }
  }

  private toSyncRunDetail(
    syncRun: SyncRunDetailRecord,
  ): SyncRunDetailResponseDto {
    return {
      ...this.toSyncRunSummary(syncRun),
      cities: syncRun.cities.map((city) => this.toSyncRunCity(city)),
    }
  }

  private toSyncRunCity(city: SyncRunCityRecord) {
    return {
      city: DB_CITY_NAME_BY_PRISMA[city.city] as CityNameType,
      status: API_SYNC_STATUS_BY_PRISMA[city.status],
      started_at: city.started_at?.toISOString() ?? null,
      finished_at: city.finished_at?.toISOString() ?? null,
      updated_at: city.updated_at.toISOString(),
      records_read: city.records_read,
      records_created: city.records_created,
      records_updated: city.records_updated,
      records_deactivated: city.records_deactivated,
      error_message: city.error_message,
    }
  }

  private toApiSyncResource(
    resource: PrismaSyncResourceType,
  ): SyncResourceType {
    switch (resource) {
      case PrismaSyncResourceType.ROUTES:
        return SyncResourceType.ROUTES
      case PrismaSyncResourceType.STOPS:
        return SyncResourceType.STOPS
      default:
        throw new Error(`Unsupported sync resource: ${resource}`)
    }
  }
}

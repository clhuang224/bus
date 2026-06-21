import { CityNameType } from '@bus/shared'
import { SyncResourceType as PrismaSyncResourceType } from '../generated/prisma/enums.js'
import type { PrismaService } from '../prisma/prisma.service.js'
import {
  TdxClientService,
  TdxMonthlyQuotaExceededError,
} from './tdx-client.service.js'

interface RequestLogCreateCall {
  data: {
    sync_run_id: string
    resource: PrismaSyncResourceType
    method: string
    path: string
    request_bytes: number
    requested_at: Date
  }
  select: { id: boolean }
}

interface RequestLogUpdateCall {
  where: { id: string }
  data: {
    status_code?: number
    response_bytes?: number
    duration_ms: number
    error_message: string | null
  }
}

function createPrismaMock({
  monthlyRequestCount = 0,
  monthlyResponseBytes = 0,
}: {
  monthlyRequestCount?: number
  monthlyResponseBytes?: number
} = {}) {
  const advisoryLockQueries: string[] = []
  const createCalls: unknown[] = []
  const updateCalls: unknown[] = []
  const transaction = {
    $executeRaw: (strings: TemplateStringsArray, ...values: unknown[]) => {
      advisoryLockQueries.push(renderSql(strings, values))
      return Promise.resolve(0)
    },
    tdxRequestLog: {
      count: () => Promise.resolve(monthlyRequestCount),
      aggregate: () =>
        Promise.resolve({
          _sum: { response_bytes: monthlyResponseBytes },
        }),
      findMany: () => Promise.resolve([]),
      create: (args: unknown) => {
        createCalls.push(args)
        return Promise.resolve({ id: 'request-log-id' })
      },
    },
  }
  const prismaService = {
    $transaction: <T>(
      callback: (client: typeof transaction) => Promise<T>,
    ): Promise<T> => callback(transaction),
    tdxRequestLog: {
      update: (args: unknown) => {
        updateCalls.push(args)
        return Promise.resolve({})
      },
    },
  }

  return { advisoryLockQueries, createCalls, prismaService, updateCalls }
}

function renderSql(strings: TemplateStringsArray, values: unknown[]): string {
  return strings
    .reduce(
      (sql, segment, index) =>
        `${sql}${segment}${index < values.length ? String(values[index]) : ''}`,
      '',
    )
    .replace(/\s+/g, ' ')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .trim()
}

describe('TdxClientService', () => {
  const originalFetch = globalThis.fetch
  const originalClientId = process.env.TDX_CLIENT_ID
  const originalClientSecret = process.env.TDX_CLIENT_SECRET

  beforeEach(() => {
    process.env.TDX_CLIENT_ID = 'client-id'
    process.env.TDX_CLIENT_SECRET = 'client-secret'
  })

  afterEach(() => {
    globalThis.fetch = originalFetch

    if (originalClientId === undefined) delete process.env.TDX_CLIENT_ID
    else process.env.TDX_CLIENT_ID = originalClientId

    if (originalClientSecret === undefined) delete process.env.TDX_CLIENT_SECRET
    else process.env.TDX_CLIENT_SECRET = originalClientSecret
  })

  it('reserves quota and records a successful TDX request', async () => {
    const { advisoryLockQueries, createCalls, prismaService, updateCalls } =
      createPrismaMock()
    const requestedUrls: string[] = []
    globalThis.fetch = ((input) => {
      const url = String(input)
      requestedUrls.push(url)

      if (url.includes('/protocol/openid-connect/token')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({ access_token: 'token', expires_in: 3600 }),
            { status: 200 },
          ),
        )
      }

      return Promise.resolve(new Response('[]', { status: 200 }))
    }) as typeof fetch
    const service = new TdxClientService(
      prismaService as unknown as PrismaService,
    )

    await expect(
      service.fetchRoutes(CityNameType.NEW_TAIPEI, 'sync-run-id'),
    ).resolves.toEqual([])

    expect(requestedUrls).toHaveLength(2)
    expect(advisoryLockQueries).toHaveLength(1)
    expect(advisoryLockQueries[0]).toBe('SELECT pg_advisory_xact_lock(2, 1)')

    expect(createCalls).toHaveLength(1)
    const createCall = createCalls[0] as RequestLogCreateCall
    expect(createCall.data.sync_run_id).toBe('sync-run-id')
    expect(createCall.data.resource).toBe(PrismaSyncResourceType.ROUTES)
    expect(createCall.data.method).toBe('GET')
    expect(createCall.data.path).toContain('/Route/City/NewTaipei')
    expect(createCall.data.request_bytes).toBeGreaterThan(0)
    expect(createCall.data.requested_at).toBeInstanceOf(Date)

    expect(updateCalls).toHaveLength(1)
    const updateCall = updateCalls[0] as RequestLogUpdateCall
    expect(updateCall.where).toEqual({ id: 'request-log-id' })
    expect(updateCall.data.status_code).toBe(200)
    expect(updateCall.data.response_bytes).toBe(2)
    expect(updateCall.data.duration_ms).toBeGreaterThanOrEqual(0)
    expect(updateCall.data.error_message).toBeNull()
  })

  it('stops before the bus request when monthly request quota is exhausted', async () => {
    const { createCalls, prismaService } = createPrismaMock({
      monthlyRequestCount: 4500,
    })
    const requestedUrls: string[] = []
    globalThis.fetch = ((input) => {
      const url = String(input)
      requestedUrls.push(url)

      return Promise.resolve(
        new Response(
          JSON.stringify({ access_token: 'token', expires_in: 3600 }),
          { status: 200 },
        ),
      )
    }) as typeof fetch
    const service = new TdxClientService(
      prismaService as unknown as PrismaService,
    )

    await expect(
      service.fetchRoutes(CityNameType.NEW_TAIPEI, 'sync-run-id'),
    ).rejects.toBeInstanceOf(TdxMonthlyQuotaExceededError)

    expect(requestedUrls).toHaveLength(1)
    expect(createCalls).toEqual([])
  })

  it('shares one token refresh across concurrent requests', async () => {
    const { prismaService } = createPrismaMock()
    let tokenRequestCount = 0
    let busRequestCount = 0

    globalThis.fetch = ((input) => {
      const url = String(input)

      if (url.includes('/protocol/openid-connect/token')) {
        tokenRequestCount += 1
        return Promise.resolve(
          new Response(
            JSON.stringify({ access_token: 'token', expires_in: 3600 }),
            { status: 200 },
          ),
        )
      }

      busRequestCount += 1
      return Promise.resolve(new Response('[]', { status: 200 }))
    }) as typeof fetch
    const service = new TdxClientService(
      prismaService as unknown as PrismaService,
    )

    await Promise.all([
      service.fetchRoutes(CityNameType.TAIPEI, 'sync-run-id'),
      service.fetchRoutes(CityNameType.NEW_TAIPEI, 'sync-run-id'),
    ])

    expect(tokenRequestCount).toBe(1)
    expect(busRequestCount).toBe(2)
  })

  it('rejects a malformed route instead of silently dropping it', async () => {
    const { prismaService } = createPrismaMock()
    globalThis.fetch = ((input) => {
      const url = String(input)

      if (url.includes('/protocol/openid-connect/token')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({ access_token: 'token', expires_in: 3600 }),
            { status: 200 },
          ),
        )
      }

      return Promise.resolve(
        new Response(JSON.stringify([{ RouteUID: 'TPE-invalid' }]), {
          status: 200,
        }),
      )
    }) as typeof fetch
    const service = new TdxClientService(
      prismaService as unknown as PrismaService,
    )

    await expect(
      service.fetchRoutes(CityNameType.TAIPEI, 'sync-run-id'),
    ).rejects.toThrow('Invalid TDX record at index 0 for /Route/City/Taipei.')
  })

  it('applies an abort signal to token and bus requests', async () => {
    const requestSignals: AbortSignal[] = []
    globalThis.fetch = (input: string | URL | Request, init?: RequestInit) => {
      if (init?.signal) requestSignals.push(init.signal)

      const url = input instanceof Request ? input.url : input.toString()

      if (url.includes('/protocol/openid-connect/token')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({ access_token: 'token', expires_in: 3600 }),
            { status: 200 },
          ),
        )
      }

      return Promise.resolve(new Response('[]', { status: 200 }))
    }
    const { prismaService } = createPrismaMock()
    const service = new TdxClientService(
      prismaService as unknown as PrismaService,
    )

    await service.fetchRoutes(CityNameType.TAIPEI, 'sync-run-id')

    expect(requestSignals).toHaveLength(2)
    expect(requestSignals.every((signal) => !signal.aborted)).toBe(true)
  })
})

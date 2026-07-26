import {
  type ArgumentsHost,
  HttpStatus,
  HttpException,
  Logger,
  type HttpArgumentsHost,
} from '@nestjs/common'
import { ErrorCode, type ApiErrorResponse } from '@bus/shared'
import { ApiExceptionFilter } from './api-exception.filter.js'
import { API_ERROR_MESSAGE_BY_CODE } from './api-response.messages.js'
import { FTBError } from './ftb-error.js'

interface MockResponse {
  statusCalls: number[]
  jsonCalls: ApiErrorResponse[]
  status: (status: number) => MockResponse
  json: (body: ApiErrorResponse) => MockResponse
}

interface MockRequest {
  headers: {
    'accept-language'?: string
  }
}

function createMockResponse(): MockResponse {
  const response: MockResponse = {
    statusCalls: [],
    jsonCalls: [],
    status: (status) => {
      response.statusCalls.push(status)
      return response
    },
    json: (body) => {
      response.jsonCalls.push(body)
      return response
    },
  }

  return response
}

function createHost(
  response: MockResponse,
  acceptLanguage?: string,
): ArgumentsHost {
  const request: MockRequest = {
    headers: { 'accept-language': acceptLanguage },
  }
  const httpHost: HttpArgumentsHost = {
    getRequest: <T = MockRequest>(): T => request as T,
    getResponse: <T = MockResponse>(): T => response as T,
    getNext: <T = unknown>(): T => undefined as T,
  }

  const host: ArgumentsHost = {
    getArgs: <T extends unknown[] = unknown[]>(): T => [] as T,
    getArgByIndex: <T = unknown>(): T => undefined as T,
    switchToRpc: () => {
      throw new Error('RPC host is not used in this test.')
    },
    switchToHttp: (): HttpArgumentsHost => httpHost,
    switchToWs: () => {
      throw new Error('WS host is not used in this test.')
    },
    getType: () => 'http',
  }

  return host
}

describe('ApiExceptionFilter', () => {
  const originalErrorDescriptor = Object.getOwnPropertyDescriptor(
    Logger.prototype,
    'error',
  )
  const originalWarnDescriptor = Object.getOwnPropertyDescriptor(
    Logger.prototype,
    'warn',
  )
  let errorLogs: Array<[message: unknown, stack?: string]> = []
  let warnLogs: unknown[] = []

  beforeEach(() => {
    errorLogs = []
    warnLogs = []
    Logger.prototype.error = ((message: unknown, stack?: string) => {
      errorLogs.push([message, stack])
    }) as Logger['error']
    Logger.prototype.warn = ((message: unknown) => {
      warnLogs.push(message)
    }) as Logger['warn']
  })

  afterEach(() => {
    if (originalErrorDescriptor) {
      Object.defineProperty(Logger.prototype, 'error', originalErrorDescriptor)
    }
    if (originalWarnDescriptor) {
      Object.defineProperty(Logger.prototype, 'warn', originalWarnDescriptor)
    }
  })

  it('does not log expected domain errors without a cause', () => {
    const response = createMockResponse()
    const filter = new ApiExceptionFilter()

    filter.catch(
      new FTBError(ErrorCode.ROUTE_NOT_FOUND, HttpStatus.NOT_FOUND),
      createHost(response),
    )

    expect(response.statusCalls).toEqual([HttpStatus.NOT_FOUND])
    expect(response.jsonCalls).toEqual([
      {
        status: HttpStatus.NOT_FOUND,
        error: {
          code: ErrorCode.ROUTE_NOT_FOUND,
          message: API_ERROR_MESSAGE_BY_CODE.ROUTE_NOT_FOUND,
        },
      },
    ])
    expect(errorLogs).toEqual([])
    expect(warnLogs).toEqual([])
  })

  it('localizes default error messages from Accept-Language', () => {
    const response = createMockResponse()
    const filter = new ApiExceptionFilter()

    filter.catch(
      new FTBError(ErrorCode.ROUTE_NOT_FOUND, HttpStatus.NOT_FOUND),
      createHost(response, 'en-US,en;q=0.9'),
    )

    expect(response.jsonCalls).toEqual([
      {
        status: HttpStatus.NOT_FOUND,
        error: {
          code: ErrorCode.ROUTE_NOT_FOUND,
          message: 'The requested route was not found.',
        },
      },
    ])
  })

  it('keeps explicitly provided domain messages unchanged', () => {
    const response = createMockResponse()
    const filter = new ApiExceptionFilter()

    filter.catch(
      new FTBError(ErrorCode.ROUTE_NOT_FOUND, HttpStatus.NOT_FOUND, {
        message: 'Custom route message.',
      }),
      createHost(response, 'en-US'),
    )

    expect(response.jsonCalls).toEqual([
      {
        status: HttpStatus.NOT_FOUND,
        error: {
          code: ErrorCode.ROUTE_NOT_FOUND,
          message: 'Custom route message.',
        },
      },
    ])
  })

  it('logs domain errors when they wrap an original cause', () => {
    const response = createMockResponse()
    const filter = new ApiExceptionFilter()

    filter.catch(
      new FTBError(ErrorCode.ROUTE_NOT_FOUND, HttpStatus.NOT_FOUND, {
        cause: new Error('Database failed.'),
      }),
      createHost(response),
    )

    expect(warnLogs).toEqual([
      'FTBError ROUTE_NOT_FOUND caused by: Database failed.',
    ])
    expect(errorLogs).toEqual([])
  })

  it('logs unexpected server errors', () => {
    const response = createMockResponse()
    const filter = new ApiExceptionFilter()
    const error = new Error('Unexpected failure.')

    filter.catch(error, createHost(response))

    expect(response.statusCalls).toEqual([HttpStatus.INTERNAL_SERVER_ERROR])
    expect(response.jsonCalls).toEqual([
      {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: {
          code: ErrorCode.SYSTEM_INTERNAL_SERVER_ERROR,
          message: API_ERROR_MESSAGE_BY_CODE.SYSTEM_INTERNAL_SERVER_ERROR,
        },
      },
    ])
    expect(errorLogs).toEqual([[error.message, error.stack]])
  })

  it('maps unlisted client HttpExceptions to system bad request', () => {
    const response = createMockResponse()
    const filter = new ApiExceptionFilter()

    filter.catch(
      new HttpException('Too many requests.', HttpStatus.TOO_MANY_REQUESTS),
      createHost(response),
    )

    expect(response.statusCalls).toEqual([HttpStatus.TOO_MANY_REQUESTS])
    expect(response.jsonCalls).toEqual([
      {
        status: HttpStatus.TOO_MANY_REQUESTS,
        error: {
          code: ErrorCode.SYSTEM_BAD_REQUEST,
          message: API_ERROR_MESSAGE_BY_CODE.SYSTEM_BAD_REQUEST,
        },
      },
    ])
    expect(errorLogs).toEqual([])
    expect(warnLogs).toEqual([])
  })
})

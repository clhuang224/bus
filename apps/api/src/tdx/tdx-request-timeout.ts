const TDX_REQUEST_TIMEOUT_MS = 30 * 1000

export interface RequestTimeout {
  signal: AbortSignal
  cancel: () => void
  didTimeout: () => boolean
}

export function createRequestTimeout(
  timeoutMs = TDX_REQUEST_TIMEOUT_MS,
): RequestTimeout {
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)
  timer.unref()

  return {
    signal: controller.signal,
    cancel: () => clearTimeout(timer),
    didTimeout: () => timedOut,
  }
}

export function toRequestError(
  error: unknown,
  timeout: RequestTimeout,
  requestName: string,
  timeoutMs = TDX_REQUEST_TIMEOUT_MS,
): unknown {
  if (!timeout.didTimeout()) return error

  return new Error(`${requestName} timed out after ${timeoutMs}ms.`, {
    cause: error,
  })
}

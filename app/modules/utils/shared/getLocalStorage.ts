const WINDOW_UNAVAILABLE_ERROR = 'window is unavailable in this environment.'
const LOCAL_STORAGE_UNAVAILABLE_ERROR = 'Failed to access localStorage in this environment.'

export class WindowUnavailableError extends Error {
  constructor() {
    super(WINDOW_UNAVAILABLE_ERROR)
    this.name = 'WindowUnavailableError'
  }
}

export function isWindowUnavailableError(error: unknown) {
  return error instanceof WindowUnavailableError
}

export function getLocalStorage() {
  if (typeof window === 'undefined') {
    throw new WindowUnavailableError()
  }

  try {
    return window.localStorage
  } catch (error) {
    throw new Error(LOCAL_STORAGE_UNAVAILABLE_ERROR, { cause: error })
  }
}

const WINDOW_UNAVAILABLE_ERROR = 'window is unavailable in this environment.'
const LOCAL_STORAGE_UNAVAILABLE_ERROR = 'Failed to access localStorage in this environment.'

export function getLocalStorage() {
  if (typeof window === 'undefined') {
    throw new Error(WINDOW_UNAVAILABLE_ERROR)
  }

  try {
    return window.localStorage
  } catch (error) {
    throw new Error(LOCAL_STORAGE_UNAVAILABLE_ERROR, { cause: error })
  }
}

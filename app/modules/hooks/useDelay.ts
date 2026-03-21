import { useEffect, useState } from 'react'

interface UseDelayOptions {
  delayMs: number | null
  enabled?: boolean
}

export function useDelay({
  delayMs,
  enabled = true
}: UseDelayOptions) {
  const [isElapsed, setIsElapsed] = useState(false)

  useEffect(() => {
    if (!enabled || delayMs == null) {
      setIsElapsed(false)
      return
    }

    setIsElapsed(false)

    const timeoutId = window.setTimeout(() => {
      setIsElapsed(true)
    }, delayMs)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [delayMs, enabled])

  return isElapsed
}

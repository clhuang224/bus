function isEnterKey(event: KeyboardEvent) {
  return event.key === 'Enter'
}

function isSpaceKey(event: KeyboardEvent) {
  return event.key === ' ' || event.key === 'Spacebar' || event.code === 'Space'
}

export function addMapMarkerActivationListeners(
  element: HTMLElement,
  onActivate: (event: MouseEvent | KeyboardEvent) => void
) {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.repeat) return

    if (isEnterKey(event)) {
      onActivate(event)
      return
    }

    if (isSpaceKey(event)) {
      // Match native button behavior by preventing page scroll on keydown
      // and triggering activation on keyup instead.
      event.preventDefault()
    }
  }

  const handleKeyUp = (event: KeyboardEvent) => {
    if (!isSpaceKey(event)) return
    onActivate(event)
  }

  element.addEventListener('click', onActivate)
  element.addEventListener('keydown', handleKeyDown)
  element.addEventListener('keyup', handleKeyUp)

  return () => {
    element.removeEventListener('click', onActivate)
    element.removeEventListener('keydown', handleKeyDown)
    element.removeEventListener('keyup', handleKeyUp)
  }
}

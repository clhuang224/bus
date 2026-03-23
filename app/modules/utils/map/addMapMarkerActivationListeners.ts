function isActivationKey(event: KeyboardEvent) {
  return event.key === 'Enter' || event.key === ' '
}

export function addMapMarkerActivationListeners(
  element: HTMLElement,
  onActivate: (event: MouseEvent | KeyboardEvent) => void
) {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isActivationKey(event)) return
    onActivate(event)
  }

  element.addEventListener('click', onActivate)
  element.addEventListener('keydown', handleKeyDown)
}

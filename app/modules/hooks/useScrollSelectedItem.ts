import { useEffect, type RefObject } from 'react'

interface UseScrollSelectedItemOptions<T extends HTMLElement> {
  behavior?: ScrollBehavior
  verticalAlignment?: ScrollLogicalPosition
  itemElementRefs: RefObject<Map<string, T | null>>
  listItems: unknown
  selectedItemId?: string | null
}

export function useScrollSelectedItem<T extends HTMLElement>({
  behavior = 'smooth',
  verticalAlignment = 'nearest',
  itemElementRefs,
  listItems,
  selectedItemId = null
}: UseScrollSelectedItemOptions<T>) {
  useEffect(() => {
    if (!selectedItemId) return

    const selectedItem = itemElementRefs.current?.get(selectedItemId)
    if (!selectedItem) return

    selectedItem.scrollIntoView({
      behavior,
      block: verticalAlignment
    })
  }, [behavior, itemElementRefs, listItems, selectedItemId, verticalAlignment])
}

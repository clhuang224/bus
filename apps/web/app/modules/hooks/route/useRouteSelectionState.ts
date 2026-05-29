import { useDisclosure } from '@mantine/hooks'
import { useCallback, useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { RouteTab } from './useRouteBaseData'

interface RouteSelectionStop {
  id: string
  realtimeBuses: Array<{ id: string }>
}

interface UseRouteSelectionStateOptions {
  defaultActiveTabId: string | null
  isSm: boolean
  routeTabs: RouteTab[]
  setActiveTab: Dispatch<SetStateAction<string | null>>
  stops: RouteSelectionStop[]
}

export function useRouteSelectionState(options: UseRouteSelectionStateOptions) {
  const { defaultActiveTabId, isSm, routeTabs, setActiveTab, stops } = options
  const [isSidebarOpened, { open: openSidebar, close: closeSidebar }] = useDisclosure(false)
  const [listScrollBehavior, setListScrollBehavior] = useState<ScrollLogicalPosition>('nearest')
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null)
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)

  useEffect(() => {
    if (isSm) {
      openSidebar()
      return
    }
  }, [isSm, openSidebar])

  useEffect(() => {
    if (!routeTabs.length) {
      setActiveTab(null)
      return
    }

    setActiveTab((currentTab) => {
      if (currentTab && routeTabs.some((tab) => tab.id === currentTab)) {
        return currentTab
      }
      return defaultActiveTabId
    })
  }, [defaultActiveTabId, routeTabs, setActiveTab])

  useEffect(() => {
    if (!selectedStopId) return
    if (stops.some((stop) => stop.id === selectedStopId)) return

    setSelectedStopId(null)
  }, [selectedStopId, stops])

  useEffect(() => {
    if (!selectedVehicleId) return
    if (stops.some((stop) => stop.realtimeBuses.some((bus) => bus.id === selectedVehicleId))) return

    setSelectedVehicleId(null)
  }, [selectedVehicleId, stops])

  const handleSelectStopFromList = useCallback((stopId: string) => {
    setListScrollBehavior('nearest')
    setSelectedStopId(stopId)
    setSelectedVehicleId(null)

    if (isSm) {
      closeSidebar()
    }
  }, [closeSidebar, isSm])

  const handleSelectVehicleFromList = useCallback((vehicleId: string) => {
    setSelectedVehicleId(vehicleId)
    setSelectedStopId(null)

    if (isSm) {
      closeSidebar()
    }
  }, [closeSidebar, isSm])

  const handleSelectVehicleFromMap = useCallback((vehicleId: string) => {
    setListScrollBehavior('start')
    setSelectedVehicleId(vehicleId)
    setSelectedStopId(null)
  }, [])

  const handleSelectStopFromMap = useCallback((stopId: string | null) => {
    setListScrollBehavior('start')
    setSelectedStopId(stopId)
    setSelectedVehicleId(null)
  }, [])

  return {
    closeSidebar,
    handleSelectStopFromList,
    handleSelectStopFromMap,
    handleSelectVehicleFromList,
    handleSelectVehicleFromMap,
    isSidebarOpened,
    listScrollBehavior,
    openSidebar,
    selectedStopId,
    selectedVehicleId
  }
}

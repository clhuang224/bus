import { AppShell, Box, Flex, useMantineTheme } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { RiHeart3Fill, RiHeart3Line, RiMapPin3Fill, RiMapPin3Line, RiSearchFill, RiSearchLine } from '@remixicon/react'
import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { Outlet, useLocation } from 'react-router'
import { AppNavLink } from '~/components/AppNavLink'
import { AreaSelect } from '~/components/AreaSelect'
import { APP_FOOTER_HEIGHT, APP_HEADER_HEIGHT } from '~/modules/consts/layout'
import { AreaType } from '~/modules/enums/AreaType'
import { useWatchGeo } from '~/modules/hooks/useWatchGeo'
import type { RootState } from '~/modules/store'
import { getAreaByCoords } from '~/modules/utils/getAreaByCoords'

export interface AreaContext {
  area: AreaType
}

export function meta() {
  return [
    { title: 'Finding the Bus' },
    { name: 'description', content: 'Go find the bus you\'ve been waiting for your whole life. (Just kidding.)' }
  ]
}

export default function AppLayout () {

  const location = useLocation()

  const theme = useMantineTheme()
  const isSm = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`)

  const [area, setArea] = useState<AreaType>(AreaType.TAIPEI)
  const { coords } = useSelector((state: RootState) => state.geolocation)
  const geojson = useSelector((state: RootState) => state.cityGeo.geojson)
  const currentArea = getAreaByCoords(coords, geojson)

  const options = useMemo(() => ([
    {
      name: '我的最愛',
      path: '/',
      icon: (<RiHeart3Line />),
      iconActive: (<RiHeart3Fill />)
    },
    {
      name: '附近站牌',
      path: '/nearby',
      icon: (<RiMapPin3Line />),
      iconActive: (<RiMapPin3Fill />)
    },
    {
      name: '搜尋公車',
      path: '/routes',
      icon: (<RiSearchLine />),
      iconActive: (<RiSearchFill />)
    }
  ]), [])

  useWatchGeo()

  useEffect(() => {
    if (!coords) return
    setArea(currentArea)
  }, [coords, currentArea])

  return (
    <AppShell
      header={{ height: APP_HEADER_HEIGHT }}
      footer={{ height: isSm ? APP_FOOTER_HEIGHT : 0 }}
    >
      <AppShell.Header h={76} p="md">
        <Flex align="center" gap="md">
          <AreaSelect value={area} onChange={setArea} readOnly={location.pathname === '/nearby'} />
          {options.map((option) => (
            <Box
              key={option.path}
              visibleFrom="sm"
            >
              <AppNavLink
                label={option.name}
                to={option.path}
              />
            </Box>
          ))}
        </Flex>
      </AppShell.Header>
      <AppShell.Main h={isSm ? 'calc(100vh - 160px)' : 'calc(100vh - 76px)'}>
        <Outlet context={{ area }} />
      </AppShell.Main>
      <AppShell.Footer p="sm" hiddenFrom="sm">
        <Flex justify="space-around" align="center" gap="md">
          {options.map((option) => (
            <Flex key={option.path} align="center" justify="center" direction="column">
              <AppNavLink
                label={option.name}
                to={option.path}
                icon={option.icon}
                iconActive={option.iconActive}
              />
            </Flex>
          ))}
        </Flex>
      </AppShell.Footer>
    </AppShell>
  )
}

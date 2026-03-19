import { AppShell, Box, Flex, useMantineTheme } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { RiHeart3Fill, RiHeart3Line, RiMapPin3Fill, RiMapPin3Line, RiSearchFill, RiSearchLine } from '@remixicon/react'
import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Outlet } from 'react-router'
import { AppNavLink } from '~/components/AppNavLink'
import { APP_FOOTER_HEIGHT, APP_HEADER_HEIGHT } from '~/modules/consts/layout'
import { useWatchGeo } from '~/modules/hooks/useWatchGeo'
import { fetchCityGeoJSON } from '~/modules/slices/cityGeoSlice'
import type { AppDispatch, RootState } from '~/modules/store'

export function meta() {
  return [
    { title: 'Finding the Bus' },
    { name: 'description', content: 'Go find the bus you\'ve been waiting for your whole life. (Just kidding.)' }
  ]
}

export default function AppLayout () {
  const dispatch = useDispatch<AppDispatch>()

  const theme = useMantineTheme()
  const isSm = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`)

  const geojson = useSelector((state: RootState) => state.cityGeo.geojson)

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
    if (geojson) return
    dispatch(fetchCityGeoJSON())
  }, [dispatch, geojson])

  return (
    <AppShell
      header={{ height: isSm ? 0 : APP_HEADER_HEIGHT }}
      footer={{ height: isSm ? APP_FOOTER_HEIGHT : 0 }}
    >
      <AppShell.Header h={76} p="md" visibleFrom="sm">
        <Flex align="center" gap="md">
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
      <AppShell.Main h={isSm ? `calc(100vh - ${APP_FOOTER_HEIGHT}px)` : `calc(100vh - ${APP_HEADER_HEIGHT}px)`}>
        <Outlet />
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

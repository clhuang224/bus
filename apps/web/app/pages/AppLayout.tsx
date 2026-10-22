import { ActionIcon, AppShell, Flex, useMantineTheme } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import {
  RiHeart3Fill,
  RiHeart3Line,
  RiMapPin3Fill,
  RiMapPin3Line,
  RiSearchFill,
  RiSearchLine,
  RiSettings3Fill,
  RiSettings3Line,
} from '@remixicon/react'
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Link, Outlet, useMatch } from 'react-router'
import { AppBrand } from '~/components/AppBrand'
import { AppNavLink } from '~/components/AppNavLink'
import {
  APP_FOOTER_HEIGHT,
  APP_HEADER_HEIGHT,
  APP_MOBILE_HEADER_HEIGHT,
} from '~/modules/consts/layout'
import { useWatchGeo } from '~/modules/hooks/app/useWatchGeo'
import { useGoogleAnalytics } from '~/modules/hooks/app/useGoogleAnalytics'
import { fetchCityGeoJSON } from '~/modules/slices/cityGeoSlice'
import type { AppDispatch, RootState } from '~/modules/store'

export default function AppLayout() {
  const dispatch = useDispatch<AppDispatch>()
  const { t } = useTranslation()

  const theme = useMantineTheme()
  const isSm = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`)

  const geojson = useSelector((state: RootState) => state.cityGeo.geojson)

  const options = useMemo(
    () => [
      {
        name: t('layout.nav.favorite'),
        path: '/',
        icon: <RiHeart3Line />,
        iconActive: <RiHeart3Fill />,
      },
      {
        name: t('layout.nav.nearby'),
        path: '/nearby',
        icon: <RiMapPin3Line />,
        iconActive: <RiMapPin3Fill />,
      },
      {
        name: t('layout.nav.routes'),
        path: '/routes',
        icon: <RiSearchLine />,
        iconActive: <RiSearchFill />,
      },
    ],
    [t],
  )

  const settingNav = useMemo(
    () => ({
      name: t('layout.nav.settings'),
      path: '/settings',
      icon: <RiSettings3Line />,
      iconActive: <RiSettings3Fill />,
    }),
    [t],
  )
  const isSettingsPage = useMatch(settingNav.path) !== null

  useWatchGeo()
  useGoogleAnalytics()

  useEffect(() => {
    if (geojson) return
    dispatch(fetchCityGeoJSON())
  }, [dispatch, geojson])

  return (
    <AppShell
      header={{ height: isSm ? APP_MOBILE_HEADER_HEIGHT : APP_HEADER_HEIGHT }}
      footer={{ height: isSm ? APP_FOOTER_HEIGHT : 0 }}
    >
      <AppShell.Header
        withBorder={false}
        bg={isSm ? 'brand.8' : undefined}
        px="md"
        py={isSm ? 0 : 'xs'}
      >
        {isSm ? (
          <Flex align="center" h="100%">
            <AppBrand inverted />
            <ActionIcon
              component={Link}
              to={settingNav.path}
              aria-label={settingNav.name}
              variant="subtle"
              color="white"
              size="lg"
              radius="xl"
              ml="auto"
            >
              {isSettingsPage ? settingNav.iconActive : settingNav.icon}
            </ActionIcon>
          </Flex>
        ) : (
          <Flex
            align="center"
            gap="xl"
            h="100%"
            px="md"
            bg="white"
            bdrs="xl"
            style={{ boxShadow: 'var(--mantine-shadow-sm)' }}
          >
            <AppBrand />
            <Flex align="center" gap="xs">
              {options.map((option) => (
                <AppNavLink
                  key={option.path}
                  label={option.name}
                  to={option.path}
                />
              ))}
            </Flex>
            <Flex ml="auto">
              <AppNavLink
                ariaLabel={settingNav.name}
                icon={settingNav.icon}
                iconActive={settingNav.iconActive}
                to={settingNav.path}
              />
            </Flex>
          </Flex>
        )}
      </AppShell.Header>
      <AppShell.Main
        h={
          isSm
            ? `calc(100vh - ${APP_MOBILE_HEADER_HEIGHT + APP_FOOTER_HEIGHT}px)`
            : `calc(100vh - ${APP_HEADER_HEIGHT}px)`
        }
      >
        <Outlet />
      </AppShell.Main>
      <AppShell.Footer p="sm" hiddenFrom="sm">
        <Flex justify="space-around" align="center" gap="md">
          {options.map((option) => (
            <Flex
              key={option.path}
              align="center"
              justify="center"
              direction="column"
            >
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

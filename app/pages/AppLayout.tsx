import { AppShell, Flex, Space, useMantineTheme } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { RiHeart3Fill, RiHeart3Line, RiMapPin3Fill, RiMapPin3Line, RiSearchFill, RiSearchLine } from '@remixicon/react'
import { useMemo, useState } from 'react'
import { Outlet } from 'react-router'
import { AppNavLink } from '~/components/AppNavLink'
import { SearchInput } from '~/components/SearchInput'
import { useWatchGeolocation } from '~/modules/hooks/useWatchGeolocation'

export function meta() {
  return [
    { title: 'Finding the Bus' },
    { name: 'description', content: 'Go find the bus you\'ve been waiting for your whole life. (Just kidding.)' }
  ]
}

export default function AppLayout () {

  const theme = useMantineTheme()
  const isSm = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`)

  const [searchInput, setSearchInput] = useState('')

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
      path: '/search',
      icon: (<RiSearchLine />),
      iconActive: (<RiSearchFill />)
    }
  ]), [])

  useWatchGeolocation()

  return (
    <AppShell
      header={{ height: isSm ? 0 : 76 }}
      footer={{ height: isSm ? 84 : 0 }}
    >
      <AppShell.Header h={76} p="md" visibleFrom="sm">
        <Flex align="center" gap="md">
          {options.filter((option) => option.path !== '/search').map((option) => (
            <AppNavLink
              key={option.path}
              label={option.name}
              href={option.path}
            />
          ))}
          <Space w="md" />
          <SearchInput
            value={searchInput}
            onChange={(value) => {
              setSearchInput(value)
            }}
          />
        </Flex>
      </AppShell.Header>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
      <AppShell.Footer p="sm" hiddenFrom="sm">
        <Flex justify="space-around" align="center" gap="md">
          {options.map((option) => (
            <Flex key={option.path} align="center" justify="center" direction="column">
              <AppNavLink
                label={option.name}
                href={option.path}
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

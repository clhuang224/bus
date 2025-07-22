import { AppLayout } from '~/components/AppLayout'
import type { Route } from './+types/Home'
import { Card, Input } from '@mantine/core'

// eslint-disable-next-line no-empty-pattern
export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Finding the Bus' },
    { name: 'description', content: 'Go find the bus you\'ve been waiting for your whole life. (Just kidding.)' }
  ]
}

const HomeNavbar = (): React.ReactElement => {
  return (
    // TODO 搜尋公車路線
    <Input placeholder="搜尋公車路線" />
  )
}

const HomeMain = (): React.ReactElement => {
  return (
    // TODO 收藏站牌
    <Card />
  )
}

export default function Home() {
  return (
    <AppLayout
      navbar={<HomeNavbar />}
      main={<HomeMain />}
    />
  )
}

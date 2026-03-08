import { Flex, Timeline } from '@mantine/core'
import { AppMap } from '~/components/AppMap'

export default function BusRoute() {
  return (
    <Flex >
      <Timeline />
      <AppMap
        center={[0, 0]}
        zoom={12}
        markers={[]}
      />
    </Flex>
  )
}

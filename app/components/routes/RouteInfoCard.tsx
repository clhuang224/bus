import { Card, Flex, NavLink, Stack, Text } from '@mantine/core'
import { Link } from 'react-router'
import { AppBadge } from '~/components/common/AppBadge'
import { cityMapName } from '~/modules/consts/city'
import type { CityNameType } from '~/modules/enums/CityNameType'

interface PropType {
  to: string
  name: string
  city: CityNameType
  departure: string
  destination: string
}

export const RouteInfoCard = ({
  to,
  name,
  city,
  departure,
  destination
}: PropType) => (
  <Card
    withBorder
    radius="md"
    p="xs"
    shadow="xs"
  >
    <NavLink
      component={Link}
      to={to}
      variant="light"
      color="blue"
      px="xs"
      py={6}
      bdrs="sm"
      label={(
        <Stack gap={8}>
          <Flex justify="space-between" align="center">
            <AppBadge type="route">
              {name}
            </AppBadge>
            <AppBadge type="city">
              {cityMapName[city]}
            </AppBadge>
          </Flex>
          <Text size="xs" c="dimmed">
            {`起訖站： ${departure} → ${destination}`}
          </Text>
        </Stack>
      )}
    />
  </Card>
)

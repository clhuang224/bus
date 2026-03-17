import { Badge, Card, Flex, NavLink, Stack, Text } from '@mantine/core'
import { Link } from 'react-router'
import { cityMapName } from '~/modules/consts/city'
import type { CityNameType } from '~/modules/enums/CityNameType'
import { RiBuildingFill, RiRouteFill } from '@remixicon/react'

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
            <Badge
              variant="light"
              color="blue"
              radius="sm"
              size="lg"
              leftSection={<RiRouteFill size="1em" />}
            >
              {name}
            </Badge>
            <Badge
              variant="light"
              color="gray"
              radius="sm"
              size="lg"
              leftSection={<RiBuildingFill size="1em" />}
            >
              {cityMapName[city]}
            </Badge>
          </Flex>
          <Text size="xs" c="dimmed">
            {`起訖站： ${departure} → ${destination}`}
          </Text>
        </Stack>
      )}
    />
  </Card>
)

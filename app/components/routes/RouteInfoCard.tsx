import { Card, Flex, NavLink, Stack, Text } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { AppBadge } from '~/components/common/AppBadge'
import type { CityNameType } from '~/modules/enums/CityNameType'
import { getCityTranslationKey } from '~/modules/utils/i18n/getCityTranslationKey'
import { getTerminalDisplay } from '~/modules/utils/i18n/getTerminalDisplay'

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
}: PropType) => {
  const { t } = useTranslation()
  const terminalDisplay = getTerminalDisplay(departure, destination)

  return (
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
                {t(getCityTranslationKey(city))}
              </AppBadge>
            </Flex>
            {terminalDisplay && (
              <Text size="xs" c="dimmed">
                {t(`components.routeInfoCard.${terminalDisplay.labelKey}`)}: {terminalDisplay.text}
              </Text>
            )}
          </Stack>
        )}
      />
    </Card>
  )
}

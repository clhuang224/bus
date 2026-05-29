import { Badge, type MantineSize } from '@mantine/core'
import { RiBuildingFill, RiRouteFill } from '@remixicon/react'
import type { ReactNode } from 'react'

interface PropType {
  children: ReactNode
  withIcon?: boolean
  size?: MantineSize
  type: 'route' | 'city'
}

export const AppBadge = ({
  withIcon = true,
  type,
  children,
  size = 'lg'
}: PropType) => {
  const icon = {
    route: <RiRouteFill size="1em" />,
    city: <RiBuildingFill size="1em" />
  }[type]

  const color = {
    route: 'blue',
    city: 'gray'
  }[type]

  return (
    <Badge
      variant="light"
      color={color}
      radius="sm"
      size={size}
      leftSection={withIcon ? icon : undefined}
    >
      {children}
    </Badge>
  )
}

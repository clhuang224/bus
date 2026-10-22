import { Badge, Box } from '@mantine/core'
import { RiBus2Fill } from '@remixicon/react'
import type { MouseEvent } from 'react'

interface PropType {
  isSelected: boolean
  onClick: (event: MouseEvent<HTMLButtonElement>) => void
  plateNumb: string
  buttonRef?: (node: HTMLButtonElement | null) => void
}

export function RouteRealtimeBadge({
  buttonRef,
  isSelected,
  onClick,
  plateNumb,
}: PropType) {
  return (
    <Box
      style={{
        display: 'inline-flex',
      }}
    >
      <Badge
        ref={buttonRef}
        component="button"
        type="button"
        aria-pressed={isSelected}
        color="sun"
        variant="light"
        size="md"
        radius="sm"
        leftSection={<RiBus2Fill size="1em" />}
        style={{
          boxShadow: isSelected
            ? '0 0 0 1px rgba(240, 200, 8, 0.45), 0 2px 6px rgba(240, 200, 8, 0.3)'
            : undefined,
          cursor: 'pointer',
          fontWeight: isSelected ? 700 : undefined,
        }}
        onClick={onClick}
      >
        {plateNumb}
      </Badge>
    </Box>
  )
}

import {
  Flex,
  Paper,
  type MantineColor,
  type MantineSpacing,
} from '@mantine/core'
import type { ReactNode } from 'react'

interface PropType {
  bg: MantineColor
  children: ReactNode
  gap?: MantineSpacing
}

export const AppHeaderBar = ({ bg, children, gap }: PropType) => (
  <Paper h="100%" px="md" bg={bg} radius="xl" shadow="sm">
    <Flex align="center" gap={gap} h="100%">
      {children}
    </Flex>
  </Paper>
)

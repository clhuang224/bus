import { Fragment } from 'react'
import { Stack } from '@mantine/core'
import type { ReactNode } from 'react'
import type { StackProps } from '@mantine/core'

interface SkeletonListProps extends Omit<StackProps, 'children'> {
  count: number
  children: ReactNode
  testId?: string
}

export const SkeletonList = ({
  count,
  children,
  testId,
  ...stackProps
}: SkeletonListProps) => (
  <Stack data-testid={testId} {...stackProps}>
    {Array.from({ length: count }, (_, index) => (
      <Fragment key={index}>{children}</Fragment>
    ))}
  </Stack>
)

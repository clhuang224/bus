import { Flex, NavLink } from '@mantine/core'
import type { ReactElement } from 'react'
import { Link, useMatch, useResolvedPath } from 'react-router'
import type { RequireAtLeastOne } from '~/modules/types/RequireAtLeastOne'

interface AppNavLinkBaseProps {
  to: string
  icon?: ReactElement
  iconActive?: ReactElement
}

type AppNavLinkAccessibleName = RequireAtLeastOne<{
  label: string
  ariaLabel: string
}>

export type AppNavLinkPropType = AppNavLinkBaseProps & AppNavLinkAccessibleName

export const AppNavLink = (props: AppNavLinkPropType) => {
  const resolvedPath = useResolvedPath(props.to)
  const isActive = useMatch({ path: resolvedPath.pathname, end: resolvedPath.pathname === '/' }) !== null

  return (
    <NavLink
      component={Link}
      to={props.to}
      aria-label={props.ariaLabel ?? props.label}
      label={(
        <Flex align="center" justify="center" direction="column">
          {props.label}
          {isActive ? (props.iconActive ?? props.icon) : props.icon}
        </Flex>
      )}
      active={isActive}
      style={{ pointerEvents: isActive ? 'none' : 'auto' }}
      w="auto"
    />
  )
}

import { Flex, NavLink } from '@mantine/core'
import type { ReactElement } from 'react'
import { Link, useMatch, useResolvedPath } from 'react-router'

export interface AppNavLinkPropType {
  to: string
	label: string
	icon?: ReactElement
	iconActive?: ReactElement
}

export const AppNavLink = (props: AppNavLinkPropType) => {
  const resolvedPath = useResolvedPath(props.to)
  const isActive = useMatch({ path: resolvedPath.pathname, end: true }) !== null

  return (
    <NavLink
      component={Link}
      to={props.to}
      label={(
        <Flex align="center" justify="center" direction="column">
          {props.label}
          {props.icon && isActive ? props.iconActive : props.icon}
        </Flex>
      )}
      active={isActive}
      style={{ pointerEvents: isActive ? 'none' : 'auto' }}
      w="auto"
    />
  )
}

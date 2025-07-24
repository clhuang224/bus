import { Flex, NavLink } from '@mantine/core'
import type { ReactElement } from 'react'
import { useLocation } from 'react-router'

export interface AppNavLinkPropType {
  href: string
	label: string
	icon?: ReactElement
	iconActive?: ReactElement
}

export const AppNavLink = (props: AppNavLinkPropType) => {
	const location = useLocation()
  return (
		<NavLink
			href={props.href}
			label={(
			<Flex align="center" justify="center" direction="column">
				{props.label}
				{props.icon && location.pathname === props.href ? props.iconActive : props.icon}
			</Flex>
			)}
			active={location.pathname === props.href}
			style={{ pointerEvents: location.pathname === props.href ? 'none' : 'auto'}}
			w="auto"
		/>
  )
}
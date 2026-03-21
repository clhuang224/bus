import { MantineProvider } from '@mantine/core'
import { render, type RenderOptions } from '@testing-library/react'
import type { PropsWithChildren, ReactElement } from 'react'
import { Provider } from 'react-redux'
import { MemoryRouter, Route as RouterRoute, Routes as RouterRoutes } from 'react-router'
import type { EnhancedStore } from '@reduxjs/toolkit'

interface RenderWithStoreOptions extends Omit<RenderOptions, 'wrapper'> {
  store: EnhancedStore
}

interface RenderWithProvidersAndRouterOptions extends RenderWithStoreOptions {
  initialEntries?: Array<string | { pathname: string, state?: unknown }>
}

interface RenderRouteOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: Array<string | { pathname: string, state?: unknown }>
  path: string
}

function MantineWrapper({ children }: PropsWithChildren) {
  return <MantineProvider>{children}</MantineProvider>
}

export function renderWithMantine(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, {
    wrapper: MantineWrapper,
    ...options
  })
}

export function renderWithStore(ui: ReactElement, { store, ...options }: RenderWithStoreOptions) {
  return render(ui, {
    wrapper: ({ children }: PropsWithChildren) => (
      <Provider store={store}>
        <MantineProvider>{children}</MantineProvider>
      </Provider>
    ),
    ...options
  })
}

export function renderWithProvidersAndRouter(
  ui: ReactElement,
  {
    initialEntries = ['/'],
    store,
    ...options
  }: RenderWithProvidersAndRouterOptions
) {
  return render(ui, {
    wrapper: ({ children }: PropsWithChildren) => (
      <Provider store={store}>
        <MantineProvider>
          <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
        </MantineProvider>
      </Provider>
    ),
    ...options
  })
}

export function renderRoute(
  ui: ReactElement,
  {
    initialEntries = ['/'],
    path,
    ...options
  }: RenderRouteOptions
) {
  return render(ui, {
    wrapper: ({ children }: PropsWithChildren) => (
      <MantineProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <RouterRoutes>
            <RouterRoute path={path} element={children} />
          </RouterRoutes>
        </MemoryRouter>
      </MantineProvider>
    ),
    ...options
  })
}

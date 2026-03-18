import { type RouteConfig, route, index } from '@react-router/dev/routes'

export default [
    route('/', './pages/AppLayout.tsx', [
        index('./pages/Favorite.tsx'),
        route('routes', './pages/Routes.tsx'),
        route('routes/:city/:id', './pages/Route.tsx'),
        route('nearby', './pages/Nearby.tsx')
    ])
] satisfies RouteConfig

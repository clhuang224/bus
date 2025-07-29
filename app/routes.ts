import { type RouteConfig, route, index } from '@react-router/dev/routes'

export default [
    route('/', './pages/AppLayout.tsx', [
        index('./pages/Favorite.tsx'),
        route('/bus-route/:city/:id', './pages/BusRoute.tsx'),
        route('/search', './pages/Search.tsx'),
        route('/nearby', './pages/Nearby.tsx')
    ])
] satisfies RouteConfig

import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import favoriteSlice from '../slices/favoriteSlice'

export function useFavoriteStops () {
    const dispatch = useDispatch()
    useEffect(() => {
        dispatch(favoriteSlice.actions.loadLocalStorage())
    }, [dispatch])

    const stops = useSelector(favoriteSlice.selectors.getFavoriteStops)

    return {
        stops
    }
}
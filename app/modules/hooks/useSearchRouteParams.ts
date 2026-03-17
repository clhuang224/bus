import { useSearchParams } from 'react-router'
import { updateSearchParam } from '../utils/updateSearchParam'

export const useSearchRouteParams = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const keyword = searchParams.get('keyword') ?? ''

  const setKeyword = (nextKeyword: string) => {
    setSearchParams((currentSearchParams) => {
      const nextSearchParams = new URLSearchParams(currentSearchParams)
      updateSearchParam(nextSearchParams, 'keyword', nextKeyword)
      return nextSearchParams
    })
  }

  return {
    keyword,
    setKeyword
  }
}

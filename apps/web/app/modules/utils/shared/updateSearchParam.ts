export const updateSearchParam = (
  searchParams: URLSearchParams,
  key: string,
  value: string | null | undefined
) => {
  if (value === undefined) return

  if (value) {
    searchParams.set(key, value)
    return
  }

  searchParams.delete(key)
}

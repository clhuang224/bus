export function getEnumValues<E extends object>(e: E) {
  const keys = Object.keys(e)

  return Object.values(e).filter(
    (value) => typeof value !== 'string' || !keys.includes(value),
  ) as E[keyof E][]
}

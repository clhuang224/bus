export function keepTdxRecords<T>(
  response: unknown,
  isRecord: (value: unknown) => value is T,
): T[] {
  if (!Array.isArray(response)) {
    throw new Error('Expected the TDX response to be an array.')
  }

  return response.filter(isRecord)
}

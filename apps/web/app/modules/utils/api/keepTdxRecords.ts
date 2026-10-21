/**
 * Keeps the TDX records that match the expected shape and drops the rest.
 * A response that is not an array means the feed failed, so it throws, which
 * makes the query fail the same way the API reports an unavailable feed.
 */
export function keepTdxRecords<T>(
  response: unknown,
  isRecord: (value: unknown) => value is T,
): T[] {
  if (!Array.isArray(response)) {
    throw new Error('Expected the TDX response to be an array.')
  }

  return response.filter(isRecord)
}

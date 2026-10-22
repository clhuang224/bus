interface QueryErrorLike {
  status?: unknown
  originalStatus?: unknown
}

interface QueryResultLike<TData, TError extends QueryErrorLike> {
  data?: TData
  error?: TError
}

interface QueryArrayWithSplitFallbackOptions<
  TItem,
  TData,
  TError extends QueryErrorLike,
> {
  items: TItem[]
  queryBatch: (batchItems: TItem[]) => Promise<QueryResultLike<TData[], TError>>
  shouldFallback?: (error: TError) => boolean
}

function isRequestTooLongStatus(status: unknown): boolean {
  return status === 414 || status === 431
}

function isParsingErrorWithRequestTooLongStatus(
  error: QueryErrorLike,
): boolean {
  return (
    error.status === 'PARSING_ERROR' &&
    isRequestTooLongStatus(error.originalStatus)
  )
}

function defaultShouldFallback<TError extends QueryErrorLike>(
  error: TError,
): boolean {
  return (
    isRequestTooLongStatus(error.status) ||
    isParsingErrorWithRequestTooLongStatus(error)
  )
}

export async function queryArrayWithSplitFallback<
  TItem,
  TData,
  TError extends QueryErrorLike,
>(
  options: QueryArrayWithSplitFallbackOptions<TItem, TData, TError>,
): Promise<QueryResultLike<TData[], TError>> {
  const { items, queryBatch, shouldFallback = defaultShouldFallback } = options
  const result = await queryBatch(items)

  if (!result.error) {
    return {
      data: result.data ?? [],
    }
  }

  if (!shouldFallback(result.error) || items.length <= 1) {
    return { error: result.error }
  }

  const middle = Math.floor(items.length / 2)
  const leftItems = items.slice(0, middle)
  const rightItems = items.slice(middle)

  const leftResult = await queryArrayWithSplitFallback({
    items: leftItems,
    queryBatch,
    shouldFallback,
  })
  if (leftResult.error) {
    return { error: leftResult.error }
  }

  const rightResult = await queryArrayWithSplitFallback({
    items: rightItems,
    queryBatch,
    shouldFallback,
  })
  if (rightResult.error) {
    return { error: rightResult.error }
  }

  return {
    data: [...(leftResult.data ?? []), ...(rightResult.data ?? [])],
  }
}

interface QueryErrorLike {
  status?: unknown
  originalStatus?: unknown
}

interface QueryResultLike<TData, TError extends QueryErrorLike> {
  data?: TData
  error?: TError
}

interface QueryArrayWith414FallbackOptions<TItem, TData, TError extends QueryErrorLike> {
  items: TItem[]
  queryBatch: (batchItems: TItem[]) => Promise<QueryResultLike<TData[], TError>>
  shouldFallback?: (error: TError) => boolean
}

function isUriTooLongStatus(status: unknown): boolean {
  return status === 414
}

function isParsingErrorWithUriTooLongStatus(error: QueryErrorLike): boolean {
  return error.status === 'PARSING_ERROR' && error.originalStatus === 414
}

function defaultShouldFallback<TError extends QueryErrorLike>(error: TError): boolean {
  return isUriTooLongStatus(error.status) || isParsingErrorWithUriTooLongStatus(error)
}

export async function queryArrayWith414Fallback<TItem, TData, TError extends QueryErrorLike>(
  options: QueryArrayWith414FallbackOptions<TItem, TData, TError>
): Promise<QueryResultLike<TData[], TError>> {
  const { items, queryBatch, shouldFallback = defaultShouldFallback } = options
  const result = await queryBatch(items)

  if (!result.error) {
    return {
      data: result.data ?? []
    }
  }

  if (!shouldFallback(result.error) || items.length <= 1) {
    return { error: result.error }
  }

  const middle = Math.floor(items.length / 2)
  const leftItems = items.slice(0, middle)
  const rightItems = items.slice(middle)

  const leftResult = await queryArrayWith414Fallback({
    items: leftItems,
    queryBatch,
    shouldFallback
  })
  if (leftResult.error) {
    return { error: leftResult.error }
  }

  const rightResult = await queryArrayWith414Fallback({
    items: rightItems,
    queryBatch,
    shouldFallback
  })
  if (rightResult.error) {
    return { error: rightResult.error }
  }

  return {
    data: [...(leftResult.data ?? []), ...(rightResult.data ?? [])]
  }
}

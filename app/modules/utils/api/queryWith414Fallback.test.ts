import { describe, expect, it, vi } from 'vitest'
import { queryArrayWith414Fallback } from './queryWith414Fallback'

describe('queryArrayWith414Fallback', () => {
  it('returns data directly when the first request succeeds', async () => {
    const queryBatch = vi.fn(async (batchItems: number[]) => ({
      data: batchItems
    }))

    const result = await queryArrayWith414Fallback({
      items: [1, 2, 3],
      queryBatch
    })

    expect(result).toEqual({ data: [1, 2, 3] })
    expect(queryBatch).toHaveBeenCalledTimes(1)
  })

  it('splits recursively for 414 and merges successful branches', async () => {
    const queryBatch = vi.fn(async (batchItems: number[]) => {
      if (batchItems.length > 2) {
        return { error: { status: 414 as const } }
      }

      if (batchItems[0] === 3 && batchItems[1] === 4) {
        return { error: { status: 414 as const } }
      }

      return { data: batchItems }
    })

    const result = await queryArrayWith414Fallback({
      items: [1, 2, 3, 4],
      queryBatch
    })

    expect(result).toEqual({ data: [1, 2, 3, 4] })
  })

  it('splits recursively when 414 is wrapped as a parsing error', async () => {
    const queryBatch = vi.fn(async (batchItems: number[]) => {
      if (batchItems.length > 2) {
        return {
          error: {
            status: 'PARSING_ERROR' as const,
            originalStatus: 414 as const,
            data: 'URI Too Long',
            error: 'SyntaxError'
          }
        }
      }

      return { data: batchItems }
    })

    const result = await queryArrayWith414Fallback({
      items: [1, 2, 3, 4],
      queryBatch
    })

    expect(result).toEqual({ data: [1, 2, 3, 4] })
  })

  it('does not split when error is not a URI-too-long error', async () => {
    const queryBatch = vi.fn(async () => ({
      error: { status: 500 as const }
    }))

    const result = await queryArrayWith414Fallback({
      items: [1, 2, 3],
      queryBatch
    })

    expect(result).toEqual({ error: { status: 500 } })
    expect(queryBatch).toHaveBeenCalledTimes(1)
  })

  it('returns error when one-item batch still fails with 414', async () => {
    const queryBatch = vi.fn(async () => ({
      error: { status: 414 as const }
    }))

    const result = await queryArrayWith414Fallback({
      items: [1],
      queryBatch
    })

    expect(result).toEqual({ error: { status: 414 } })
    expect(queryBatch).toHaveBeenCalledTimes(1)
  })
})

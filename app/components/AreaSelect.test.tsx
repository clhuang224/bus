// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AreaSelect } from './AreaSelect'
import { AreaType } from '~/modules/enums/AreaType'
import { areaMapAreaName } from '~/modules/consts/area'

vi.mock('@mantine/core', () => ({
  Select: ({
    value,
    data,
    onChange
  }: {
    value: string
    data: Array<{ label: string, value: string }>
    onChange: (value: string | null) => void
  }) => (
    <select
      aria-label="area-select"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {data.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}))

describe('AreaSelect', () => {
  afterEach(() => {
    cleanup()
  })

  it('calls onChange with the selected area', () => {
    const handleChange = vi.fn()

    render(
      <AreaSelect
        value={AreaType.TAIPEI}
        onChange={handleChange}
      />
    )

    fireEvent.change(screen.getByLabelText('area-select'), {
      target: { value: AreaType.TAICHUNG }
    })

    expect(handleChange).toHaveBeenCalledWith(AreaType.TAICHUNG)
  })

  it('syncs the displayed value when the controlled prop changes', () => {
    const handleChange = vi.fn()
    const { rerender, container } = render(
      <AreaSelect
        value={AreaType.TAIPEI}
        onChange={handleChange}
      />
    )

    const areaSelect = () => within(container).getByLabelText('area-select')

    expect(areaSelect()).toHaveValue(AreaType.TAIPEI)
    expect((within(areaSelect()).getByRole('option', { name: areaMapAreaName[AreaType.TAIPEI] }) as HTMLOptionElement).selected).toBe(true)

    rerender(
      <AreaSelect
        value={AreaType.TAICHUNG}
        onChange={handleChange}
      />
    )

    expect(areaSelect()).toHaveValue(AreaType.TAICHUNG)
    expect((within(areaSelect()).getByRole('option', { name: areaMapAreaName[AreaType.TAICHUNG] }) as HTMLOptionElement).selected).toBe(true)
  })
})

// @vitest-environment jsdom

import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AreaSelect } from './AreaSelect'
import { AreaType } from '~/modules/enums/AreaType'
import i18n from '~/modules/i18n'

vi.mock('@mantine/core', () => ({
  Select: ({
    'aria-label': ariaLabel,
    value,
    data,
    onChange
  }: {
    'aria-label'?: string
    value: string
    data: Array<{ label: string, value: string }>
    onChange: (value: string | null) => void
  }) => (
    <select
      aria-label={ariaLabel}
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
  it('calls onChange with the selected area', () => {
    const handleChange = vi.fn()

    render(
      <AreaSelect
        value={AreaType.TAIPEI}
        onChange={handleChange}
      />
    )

    fireEvent.change(screen.getByLabelText(i18n.t('components.areaSelect.ariaLabel')), {
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

    const areaSelect = () => within(container).getByLabelText(i18n.t('components.areaSelect.ariaLabel'))

    expect(areaSelect()).toHaveValue(AreaType.TAIPEI)
    expect((within(areaSelect()).getByRole('option', { name: i18n.t('common.area.Taipei') }) as HTMLOptionElement).selected).toBe(true)

    rerender(
      <AreaSelect
        value={AreaType.TAICHUNG}
        onChange={handleChange}
      />
    )

    expect(areaSelect()).toHaveValue(AreaType.TAICHUNG)
    expect((within(areaSelect()).getByRole('option', { name: i18n.t('common.area.Taichung') }) as HTMLOptionElement).selected).toBe(true)
  })
})

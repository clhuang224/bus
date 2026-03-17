import { CloseButton, Input } from '@mantine/core'
import { RiSearchLine } from '@remixicon/react'
import type { ReactElement } from 'react'

export interface SearchInputPropType {
  value: string
  onChange: (value: string) => void
  w?: number | string
}

export const SearchInput = (props: SearchInputPropType): ReactElement => {
  return (
    <Input
      placeholder={'搜尋公車'}
      leftSection={<RiSearchLine />}
      rightSection={props.value && (
          <CloseButton
            onClick={() => {
              props.onChange('')
            }}
          />
      )}
      style={{ '--input-right-section-pointer-events': 'auto' }}
      w={props.w ?? 400}
      value={props.value}
      onChange={(e) => {
        props.onChange(e.currentTarget.value)
      }}
    />
  )
}

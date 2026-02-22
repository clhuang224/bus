import { CloseButton, Input } from '@mantine/core'
import { RiSearchLine } from '@remixicon/react'
import { useState, type ReactElement } from 'react'

export interface SearchInputPropType {
  value: string
  onChange: (value: string) => void
  w?: number | string
}

export const SearchInput = (props: SearchInputPropType): ReactElement => {
  const [value, setValue] = useState(props.value)

  return (
    <Input
      placeholder={'搜尋公車'}
      leftSection={<RiSearchLine />}
      rightSection={props.value && (
          <CloseButton
            onClick={() => {
              setValue('')
              props.onChange(value)
            }}
          />
      )}
      style={{ '--input-right-section-pointer-events': 'auto' }}
      w={props.w ?? 400}
      value={value}
      onChange={(e) => {
        setValue(e.currentTarget.value)
        props.onChange(value)
      }}
    />
  )
}
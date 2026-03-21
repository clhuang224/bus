import { CloseButton, Input } from '@mantine/core'
import { RiSearchLine } from '@remixicon/react'
import type { ReactElement } from 'react'

export interface SearchInputPropType {
  value: string
  onChange: (value: string) => void
}

export const SearchInput = (props: SearchInputPropType): ReactElement => {
  return (
    <Input
      aria-label="搜尋公車路線"
      placeholder={'輸入關鍵字以搜尋路線、起點或終點'}
      leftSection={<RiSearchLine />}
      rightSection={props.value && (
          <CloseButton
            onClick={() => {
              props.onChange('')
            }}
          />
      )}
      style={{ '--input-right-section-pointer-events': 'auto' }}
      value={props.value}
      onChange={(e) => {
        props.onChange(e.currentTarget.value)
      }}
      flex={1}
    />
  )
}

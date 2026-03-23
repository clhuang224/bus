import { CloseButton, Input } from '@mantine/core'
import { RiSearchLine } from '@remixicon/react'
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'

export interface SearchInputPropType {
  value: string
  onChange: (value: string) => void
}

export const SearchInput = (props: SearchInputPropType): ReactElement => {
  const { t } = useTranslation()

  return (
    <Input
      aria-label={t('components.searchInput.ariaLabel')}
      placeholder={t('components.searchInput.placeholder')}
      leftSection={<RiSearchLine />}
      rightSection={props.value && (
          <CloseButton
            aria-label={t('components.searchInput.clearAriaLabel')}
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
      flex="1 1 0"
      miw={0}
    />
  )
}

import { Select } from '@mantine/core'
import { useEffect, useState, type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { AreaType } from '~/modules/enums/AreaType'
import { getAreaTranslationKey } from '~/modules/utils/i18n/getAreaTranslationKey'
import { getEnumValues } from '~/modules/utils/shared/getEnumValues'

export interface AreaSelectPropType {
  value: AreaType
  onChange: (value: AreaType) => void
  readOnly?: boolean
}

export const AreaSelect = (props: AreaSelectPropType): ReactElement => {
  const { t } = useTranslation()
  const [value, setValue] = useState(props.value)

  useEffect(() => {
    setValue(props.value)
  }, [props.value])

  const options = getEnumValues(AreaType).map((area) => ({
    label: t(getAreaTranslationKey(area)),
    value: area
  }))

  return (
    <Select
      aria-label={t('components.areaSelect.ariaLabel')}
      flex="0 0 124px"
      value={value}
      data={options}
      onChange={(value) => {
        if (!value) return
        setValue(value as AreaType)
        props.onChange(value as AreaType)
      }}
      readOnly={props.readOnly}
    />
  )
}

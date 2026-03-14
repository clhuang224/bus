import { Select } from '@mantine/core'
import { useEffect, useState, type ReactElement } from 'react'
import { areaMapAreaName } from '~/modules/consts/area'
import { AreaType } from '~/modules/enums/AreaType'
import { getEnumValues } from '~/modules/utils/getEnumValues'

export interface AreaSelectPropType {
  value: AreaType
  onChange: (value: AreaType) => void
  readOnly?: boolean
}

export const AreaSelect = (props: AreaSelectPropType): ReactElement => {
  const [value, setValue] = useState(props.value)

  useEffect(() => {
    setValue(props.value)
  }, [props.value])

  const options = getEnumValues(AreaType).map((area) => ({
    label: areaMapAreaName[area],
    value: area
  }))

  return (
    <Select
      w={80}
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

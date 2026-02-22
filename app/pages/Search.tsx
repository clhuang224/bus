import { Flex } from '@mantine/core'
import { useState } from 'react'
import { SearchInput } from '~/components/SearchInput'

export default function Search() {

  const [searchInput, setSearchInput] = useState('')

  return (
    <Flex justify="center" p="md">
      <SearchInput
        value={searchInput}
        onChange={(value) => {
          setSearchInput(value)
        }}
        w="100%"
      />
    </Flex>
  )
}
